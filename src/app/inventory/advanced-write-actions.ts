import { currentAccountSelector } from 'app/accounts/selectors';
import { HttpStatusError } from 'app/bungie-api/http-client';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { ThunkResult } from 'app/store/types';
import { DimError } from 'app/utils/dim-error';
import { errorLog } from 'app/utils/log';
import { Destiny2CoreSettings } from 'bungie-api-ts/core';
import {
  AwaAuthorizationResult,
  AwaType,
  AwaUserSelection,
  DestinyItemChangeResponse,
  DestinySocketArrayType,
  insertSocketPlug,
  insertSocketPlugFree,
} from 'bungie-api-ts/destiny2';
import { get, set } from 'idb-keyval';
import { DestinyAccount } from '../accounts/destiny-account';
import { authenticatedHttpClient } from '../bungie-api/bungie-service-helper';
import { getSingleItem, requestAdvancedWriteActionToken } from '../bungie-api/destiny2-api';
import { showNotification } from '../notifications/notifications';
import { awaItemChanged } from './actions';
import { DimItem, DimSocket } from './item-types';
import { currentStoreSelector, d2BucketsSelector } from './selectors';

let awaCache: {
  [key: number]: AwaAuthorizationResult & { used: number };
};

export function canInsertPlug(
  socket: DimSocket,
  plugItemHash: number,
  destiny2CoreSettings: Destiny2CoreSettings,
  defs: D2ManifestDefinitions
) {
  return $featureFlags.awa || canInsertForFree(socket, plugItemHash, destiny2CoreSettings, defs);
}

function canInsertForFree(
  socket: DimSocket,
  plugItemHash: number,
  destiny2CoreSettings: Destiny2CoreSettings,
  defs: D2ManifestDefinitions
) {
  const { insertPlugFreeProtectedPlugItemHashes, insertPlugFreeBlockedSocketTypeHashes } =
    destiny2CoreSettings;
  if (
    (insertPlugFreeProtectedPlugItemHashes || []).includes(plugItemHash) ||
    (insertPlugFreeBlockedSocketTypeHashes || []).includes(socket.socketDefinition.socketTypeHash)
  ) {
    return false;
  }

  const plug = defs.InventoryItem.get(plugItemHash);

  const free =
    // Must be reusable or randomized type
    Boolean(
      socket.socketDefinition.reusablePlugItems.length > 0 ||
        socket.socketDefinition.reusablePlugSetHash ||
        socket.socketDefinition.randomizedPlugSetHash
    ) &&
    // And have no cost to insert
    !plug.plug?.insertionMaterialRequirementHash &&
    // And the current plug didn't cost anything (can't replace a non-free mod with a free one)
    (!socket.plugged || !socket.plugged.plugDef.plug.insertionMaterialRequirementHash);

  return free;
}

/**
 * Modify an item to insert a new plug into one of its socket.
 */
export function insertPlug(item: DimItem, socket: DimSocket, plugItemHash: number): ThunkResult {
  return async (dispatch, getState) => {
    const account = currentAccountSelector(getState())!;

    const free = canInsertForFree(
      socket,
      plugItemHash,
      getState().manifest.destiny2CoreSettings!,
      d2ManifestSelector(getState())!
    );

    // The API requires either the ID of the character that owns the item, or
    // the current character ID if the item is in the vault.
    const storeId = item.owner === 'vault' ? currentStoreSelector(getState())!.id : item.owner;

    try {
      const insertFn = free ? awaInsertSocketPlugFree : awaInsertSocketPlug;
      const response = await insertFn(account, storeId, item, socket, plugItemHash);

      // Update items that changed
      // TODO: param to skip this?
      await dispatch(refreshItemAfterAWA(item, response.Response));
    } catch (e) {
      errorLog('AWA', "Couldn't insert plug", item, e);
      if (e instanceof DimError && e.cause instanceof HttpStatusError && e.cause.status === 404) {
        showNotification({
          type: 'error',
          title: 'Not Yet!',
          body: "Changing perks and mods won't be available until the launch of the Bungie 30th Anniversary patch on December 7th.",
        });
      } else {
        showNotification({ type: 'error', title: t('AWA.Error'), body: e.message });
      }
      throw e;
    }
  };
}

async function awaInsertSocketPlugFree(
  account: DestinyAccount,
  storeId: string,
  item: DimItem,
  socket: DimSocket,
  plugItemHash: number
) {
  return insertSocketPlugFree(authenticatedHttpClient, {
    itemId: item.id,
    plug: {
      socketIndex: socket.socketIndex,
      socketArrayType: DestinySocketArrayType.Default,
      plugItemHash,
    },
    characterId: storeId,
    membershipType: account.originalPlatformType,
  });
}

async function awaInsertSocketPlug(
  account: DestinyAccount,
  storeId: string,
  item: DimItem,
  socket: DimSocket,
  plugItemHash: number
) {
  const actionToken = await getAwaToken(account, AwaType.InsertPlugs, storeId, item);

  // TODO: if the plug costs resources to insert, add a confirmation. This'd
  // be a great place for a dialog component?

  return insertSocketPlug(authenticatedHttpClient, {
    actionToken,
    itemInstanceId: item.id,
    plug: {
      socketIndex: socket.socketIndex,
      socketArrayType: DestinySocketArrayType.Default,
      plugItemHash,
    },
    characterId: storeId,
    membershipType: account.originalPlatformType,
  });
}

/**
 * Updating items is supposed to return the new item... but sometimes it comes back weird. Instead we'll just load the item.
 */
// TODO: Would be nice to do bulk updates without reloading the item every time
function refreshItemAfterAWA(item: DimItem, changes: DestinyItemChangeResponse): ThunkResult {
  return async (dispatch, getState) => {
    // Update items that changed
    const account = currentAccountSelector(getState())!;
    try {
      const itemInfo = await getSingleItem(item.id, account);
      changes = { ...changes, item: itemInfo };
    } catch (e) {
      errorLog('AWA', 'Unable to refresh item, falling back on AWA response', item, e);
    }

    dispatch(
      awaItemChanged({
        changes,
        defs: d2ManifestSelector(getState())!,
        buckets: d2BucketsSelector(getState())!,
      })
    );
  };
}

/**
 * Given a request for an action token, and a particular action type, return either
 * a cached token or fetch and return a new one.
 *
 * Note: Error/success messaging must be handled by callers, but this will pop up a prompt to go to the app and grant permissions.
 *
 * @param item The item is optional unless the type is DismantleGroupA, but it's best to pass it when possible.
 */
export async function getAwaToken(
  account: DestinyAccount,
  action: AwaType,
  storeId: string,
  item?: DimItem
): Promise<string> {
  if (!awaCache) {
    // load from cache first time
    // TODO: maybe put this in Redux!
    awaCache = (await get('awa-tokens')) || {};
  }

  let info = awaCache[action];
  if (!info || !tokenValid(info)) {
    try {
      // Note: Error messages should be handled by other components. This is just to tell them to check the app.
      showNotification({
        type: 'info',
        title: t('AWA.ConfirmTitle'),
        body: t('AWA.ConfirmDescription'),
      });

      // TODO: Do we need to cache a token per item?
      info = awaCache[action] = {
        ...(await requestAdvancedWriteActionToken(account, action, storeId, item)),
        used: 0,
      };

      // Deletes of "group A" require an item and shouldn't be cached
      // TODO: This got removed from the API
      /*
      if (action === AwaType.DismantleGroupA) {
        delete awaCache[action]; // don't cache
      }
      */
    } catch (e) {
      throw new DimError('AWA.FailedToken').withError(e);

      // TODO: handle userSelection, responseReason (TimedOut, Replaced)
    }

    if (!info || !tokenValid(info)) {
      throw new DimError('AWA.FailedToken', info ? info.developerNote : 'no response');
    }
  }

  info.used++;

  // TODO: really should use a separate db for this
  await set('awa-tokens', awaCache);

  return info.actionToken;
}

function tokenValid(info: AwaAuthorizationResult & { used: number }) {
  return (
    (!info.validUntil || new Date(info.validUntil) > new Date()) &&
    (info.maximumNumberOfUses === 0 || info.used <= info.maximumNumberOfUses) &&
    info.userSelection === AwaUserSelection.Approved
  );
}
