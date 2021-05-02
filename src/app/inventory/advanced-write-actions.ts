import { currentAccountSelector } from 'app/accounts/selectors';
import { t } from 'app/i18next-t';
import { ThunkResult } from 'app/store/types';
import {
  AwaAuthorizationResult,
  AwaType,
  AwaUserSelection,
  DestinySocketArrayType,
  insertSocketPlug,
} from 'bungie-api-ts/destiny2';
import { get, set } from 'idb-keyval';
import { DestinyAccount } from '../accounts/destiny-account';
import { authenticatedHttpClient } from '../bungie-api/bungie-service-helper';
import { requestAdvancedWriteActionToken } from '../bungie-api/destiny2-api';
import { showNotification } from '../notifications/notifications';
import { awaItemChanged } from './actions';
import { DimItem, DimSocket } from './item-types';
import { bucketsSelector } from './selectors';

let awaCache: {
  [key: number]: AwaAuthorizationResult & { used: number };
};

// TODO: owner can't be "vault" I bet
export function insertPlug(item: DimItem, socket: DimSocket, plugItemHash: number): ThunkResult {
  return async (dispatch, getState) => {
    const account = currentAccountSelector(getState())!;
    const actionToken = await getAwaToken(account, AwaType.InsertPlugs, item);

    // TODO: Catch errors and show a notification?

    // TODO: if the plug costs resources to insert, add a confirmation. This'd
    // be a great place for a dialog component?

    const response = await insertSocketPlug(authenticatedHttpClient, {
      actionToken,
      itemInstanceId: item.id,
      plug: {
        socketIndex: socket.socketIndex,
        socketArrayType: DestinySocketArrayType.Default,
        plugItemHash,
      },
      characterId: item.owner,
      membershipType: account.originalPlatformType,
    });

    // Update items that changed
    dispatch(
      awaItemChanged({
        changes: response.Response,
        defs: getState().manifest.d2Manifest!,
        buckets: bucketsSelector(getState())!,
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
        ...(await requestAdvancedWriteActionToken(account, action, item)),
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
      throw new Error('Unable to get a token: ' + e.message);

      // TODO: handle userSelection, responseReason (TimedOut, Replaced)
    }

    if (!info || !tokenValid(info)) {
      throw new Error('Unable to get a token: ' + (info ? info.developerNote : 'no response'));
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
