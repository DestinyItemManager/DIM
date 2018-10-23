import { DestinyAccount } from '../accounts/destiny-account.service';
import {
  AwaType,
  AwaAuthorizationResult,
  AwaUserSelection,
  insertSocketPlug,
  DestinySocketArrayType
} from 'bungie-api-ts/destiny2';
import { requestAdvancedWriteActionToken } from '../bungie-api/destiny2-api';
import { get, set } from 'idb-keyval';
import { toaster } from '../ngimport-more';
import { t } from 'i18next';
import { DimSocket, D2Item } from './item-types';
import { httpAdapter } from '../bungie-api/bungie-service-helper';

let awaCache: {
  [key: number]: AwaAuthorizationResult & { used: number };
};

// TODO: we need an interface for presenting non-reusable plugs like mods and shaders
// TODO: owner can't be "vault" I bet
export async function insertPlug(
  account: DestinyAccount,
  item: D2Item,
  socket: DimSocket,
  plugItemHash: number
) {
  const actionToken = await getAwaToken(account, AwaType.InsertPlugs, item);

  // TODO: if the plug costs resources to insert, add a confirmation

  return insertSocketPlug(httpAdapter, {
    actionToken,
    itemInstanceId: item.id,
    plug: {
      socketIndex: socket.socketIndex,
      socketArrayType: DestinySocketArrayType.Default,
      plugItemHash
    },
    characterId: item.owner,
    membershipType: account.platformType
  });

  // TODO: need to update the item after modifying, and signal that it has changed (Redux?)
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
  item?: D2Item
): Promise<string> {
  if (!awaCache) {
    // load from cache first time
    awaCache = ((await get('awa-tokens')) || {}) as {
      [key: number]: AwaAuthorizationResult & { used: number };
    };
  }

  let info = awaCache[action];
  if (!info || !tokenValid(info)) {
    try {
      // Note: Error messages should be handled by other components. This is just to tell them to check the app.
      toaster.pop('info', t('AWA.ConfirmTitle'), t('AWA.ConfirmDescription'));

      info = awaCache[action] = {
        ...(await requestAdvancedWriteActionToken(account, action, item)),
        used: 0
      };

      // Deletes of "group A" require an item and shouldn't be cached
      // TODO: This got removed from the API
      /*
      if (action === AwaType.DismantleGroupA) {
        delete awaCache[action]; // don't cache
      }
      */
    } catch (e) {
      throw new Error('Unable to get a token: ' + e.message);
    }

    if (!info || !tokenValid(info)) {
      throw new Error('Unable to get a token: ' + info ? info.developerNote : 'no response');
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
