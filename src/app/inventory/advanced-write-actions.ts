import { DestinyAccount } from "../accounts/destiny-account.service";
import { DimItem, DimSocket } from "./store/d2-item-factory.service";
import { AwaType, AwaAuthorizationResult, AwaUserSelection, insertSocketPlug, DestinySocketArrayType } from "bungie-api-ts/destiny2";
import { requestAdvancedWriteActionToken } from "../bungie-api/destiny2-api";
import * as idbKeyval from 'idb-keyval';
import { httpAdapterWithRetry } from "../bungie-api/bungie-service-helper";

let awaCache: {
  [key: number]: AwaAuthorizationResult & { used: number };
};

// TODO: we need an interface for presenting non-reusable plugs like mods and shaders
// TODO: owner can't be "vault" I bet
export async function insertPlug(account: DestinyAccount, item: DimItem, socket: DimSocket, plugItemHash: number) {
  const actionToken = await getAwaToken(account, AwaType.InsertPlugs, item);

  return insertSocketPlug(httpAdapterWithRetry, {
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
}

/**
 * Given a request for an action token, and a particular action type, return either
 * a cached token or fetch and return a new one.
 *
 * @param item The item is optional unless the type is DismantleGroupA, but it's best to pass it when possible.
 */
export async function getAwaToken(account: DestinyAccount, action: AwaType, item?: DimItem): Promise<string> {
  if (!awaCache) {
    // load from cache first time
    awaCache = (await idbKeyval.get('awa-tokens') || {}) as {
      [key: number]: AwaAuthorizationResult & { used: number };
    };
  }

  let info = awaCache[action];
  if (!info || !tokenValid(info)) {
    try {
      info = awaCache[action] = {
        ...await requestAdvancedWriteActionToken(account, action, item),
        used: 0
      };

      // Deletes of "group A" require an item and shouldn't be cached
      /*
      if (action === AwaType.DismantleGroupA) {
        delete awaCache[action]; // don't cache
      }
      */

      // TODO: really should use a separate db for this
      // without blocking, save this
      idbKeyval.set('awa-tokens', awaCache);
    } catch (e) {
      throw new Error("Unable to get a token: " + e.message);
    }

    if (!info || !tokenValid(info)) {
      throw new Error("Unable to get a token: " + info ? info.developerNote : "no response");
    }
  }

  info.used++;
  return info.actionToken;
}

function tokenValid(info: AwaAuthorizationResult & { used: number }) {
  return (!info.validUntil || new Date(info.validUntil) > new Date()) &&
    (info.maximumNumberOfUses === 0 && info.used <= info.maximumNumberOfUses) &&
    info.userSelection === AwaUserSelection.Approved;
}
