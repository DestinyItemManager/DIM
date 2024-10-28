import { handleAuthErrors } from 'app/accounts/actions';
import { getPlatforms } from 'app/accounts/platforms';
import { currentAccountSelector } from 'app/accounts/selectors';
import {
  D1CharacterData,
  D1Inventory,
  D1ItemComponent,
  D1VaultInventory,
} from 'app/destiny1/d1-manifest-types';
import { ThunkResult } from 'app/store/types';
import { convertToError, errorMessage } from 'app/utils/errors';
import { errorLog, infoLog } from 'app/utils/log';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import { getStores } from '../bungie-api/destiny1-api';
import { bungieErrorToaster } from '../bungie-api/error-toaster';
import { D1ManifestDefinitions, getDefinitions } from '../destiny1/d1-definitions';
import { showNotification } from '../notifications/notifications';
import { loadingTracker } from '../shell/loading-tracker';
import { reportException } from '../utils/sentry';
import { error, loadNewItems, update } from './actions';
import { cleanInfos } from './dim-item-info';
import { InventoryBuckets } from './inventory-buckets';
import { d1BucketsSelector, storesLoadedSelector } from './selectors';
import { D1Store } from './store-types';
import { processItems } from './store/d1-item-factory';
import { makeCharacter, makeVault } from './store/d1-store-factory';
import { resetItemIndexGenerator } from './store/item-index';

/**
 * Returns a promise for a fresh view of the stores and their items.
 */
// TODO: combine with d2 stores action!
export function loadStores(): ThunkResult<D1Store[] | undefined> {
  return async (dispatch, getState) => {
    const promise = (async () => {
      let account = currentAccountSelector(getState());
      if (!account) {
        await dispatch(getPlatforms);
        account = currentAccountSelector(getState());
        if (!account || account.destinyVersion !== 1) {
          return;
        }
      }

      try {
        resetItemIndexGenerator();

        const [defs, , { characters, profileInventory, vaultInventory }] = await Promise.all([
          dispatch(getDefinitions()),
          dispatch(loadNewItems(account)),
          getStores(account),
        ]);

        const lastPlayedDate = findLastPlayedDate(characters);
        const buckets = d1BucketsSelector(getState())!;

        const stores = [
          ...characters.map((characterData) =>
            processCharacter(characterData, defs, buckets, lastPlayedDate),
          ),
          processVault(vaultInventory, defs, buckets),
        ];
        const currencies = processCurrencies(profileInventory, defs);

        // If we switched account since starting this, give up
        if (account !== currentAccountSelector(getState())) {
          return;
        }

        dispatch(cleanInfos(stores));
        dispatch(update({ stores, currencies }));

        return stores;
      } catch (e) {
        errorLog('d1-stores', 'Error loading stores', e);
        reportException('D1StoresService', e);

        // If we switched account since starting this, give up
        if (account !== currentAccountSelector(getState())) {
          return;
        }

        dispatch(handleAuthErrors(e));

        if (storesLoadedSelector(getState())) {
          // don't replace their inventory with the error, just notify
          showNotification(bungieErrorToaster(errorMessage(e)));
        } else {
          dispatch(error(convertToError(e)));
        }
        // It's important that we swallow all errors here - otherwise
        // our observable will fail on the first error. We could work
        // around that with some rxjs operators, but it's easier to
        // just make this never fail.
        return undefined;
      }
    })();
    loadingTracker.addPromise(promise);
    return promise;
  };
}

function processCurrencies(profileInventory: D1Inventory, defs: D1ManifestDefinitions) {
  try {
    return profileInventory.currencies.map((c) => {
      const itemDef = defs.InventoryItem.get(c.itemHash);
      return {
        itemHash: c.itemHash,
        quantity: c.value,
        displayProperties: {
          name: itemDef.itemName,
          description: itemDef.itemDescription,
          icon: itemDef.icon,
          hasIcon: Boolean(itemDef.icon),
        } as DestinyDisplayPropertiesDefinition,
      };
    });
  } catch (e) {
    infoLog('d1-stores', 'error processing currencies', e);
  }
  return [];
}

/**
 * Process a single store from its raw form to a DIM store, with all the items.
 */
function processCharacter(
  characterData: D1CharacterData,
  defs: D1ManifestDefinitions,
  buckets: InventoryBuckets,
  lastPlayedDate: Date,
) {
  const store = makeCharacter(characterData, defs, lastPlayedDate);

  let items: D1ItemComponent[] = [];
  for (const buckets of Object.values(characterData.inventory.buckets)) {
    for (const bucket of buckets) {
      for (const item of bucket.items) {
        item.bucket = bucket.bucketHash;
      }
      items = items.concat(bucket.items);
    }
  }

  store.items = processItems(store, items, defs, buckets);
  store.hadErrors = items.length !== store.items.length;
  return store;
}

/**
 * Process a single store from its raw form to a DIM store, with all the items.
 */
function processVault(
  vaultInventory: D1VaultInventory,
  defs: D1ManifestDefinitions,
  buckets: InventoryBuckets,
) {
  const store = makeVault();

  let items: D1ItemComponent[] = [];

  for (const bucket of Object.values(vaultInventory.buckets)) {
    for (const item of bucket.items) {
      item.bucket = bucket.bucketHash;
    }
    items = items.concat(bucket.items);
  }

  store.items = processItems(store, items, defs, buckets);
  store.hadErrors = items.length !== store.items.length;
  return store;
}

/**
 * Find the date of the most recently played character.
 */
function findLastPlayedDate(characterData: D1CharacterData[]): Date {
  return characterData.reduce((memo, characterData) => {
    const d1 = new Date(characterData.character.characterBase.dateLastPlayed);

    return memo ? (d1 >= memo ? d1 : memo) : d1;
  }, new Date(0));
}
