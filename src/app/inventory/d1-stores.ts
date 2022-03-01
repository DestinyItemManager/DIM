import { handleAuthErrors } from 'app/accounts/actions';
import { getPlatforms } from 'app/accounts/platforms';
import { currentAccountSelector } from 'app/accounts/selectors';
import {
  D1CharacterResponse,
  D1ItemComponent,
  D1VaultResponse,
} from 'app/destiny1/d1-manifest-types';
import { ThunkResult } from 'app/store/types';
import { errorLog, infoLog } from 'app/utils/log';
import { DestinyDisplayPropertiesDefinition } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { getStores } from '../bungie-api/destiny1-api';
import { bungieErrorToaster } from '../bungie-api/error-toaster';
import { D1ManifestDefinitions, getDefinitions } from '../destiny1/d1-definitions';
import { showNotification } from '../notifications/notifications';
import { loadingTracker } from '../shell/loading-tracker';
import { reportException } from '../utils/exceptions';
import { error, loadNewItems, update } from './actions';
import { cleanInfos } from './dim-item-info';
import { InventoryBuckets } from './inventory-buckets';
import { d1BucketsSelector, storesSelector } from './selectors';
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
        await dispatch(getPlatforms());
        account = currentAccountSelector(getState());
        if (!account || account.destinyVersion !== 1) {
          return;
        }
      }

      try {
        resetItemIndexGenerator();

        const [defs, , rawStores] = await Promise.all([
          dispatch(getDefinitions()) as any as Promise<D1ManifestDefinitions>,
          dispatch(loadNewItems(account)),
          getStores(account),
        ]);

        const lastPlayedDate = findLastPlayedDate(rawStores);
        const buckets = d1BucketsSelector(getState())!;

        const stores = _.compact(
          rawStores.map((raw) => processStore(raw, defs, buckets, lastPlayedDate))
        );
        const currencies = processCurrencies(rawStores, defs);

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

        if (storesSelector(getState()).length > 0) {
          // don't replace their inventory with the error, just notify
          showNotification(bungieErrorToaster(e));
        } else {
          dispatch(error(e));
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

function processCurrencies(rawStores: D1CharacterResponse[], defs: D1ManifestDefinitions) {
  try {
    return rawStores[0].character.base.inventory.currencies.map((c) => {
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
function processStore(
  raw: D1CharacterResponse | D1VaultResponse,
  defs: D1ManifestDefinitions,
  buckets: InventoryBuckets,
  lastPlayedDate: Date
) {
  if (!raw) {
    return undefined;
  }

  let store: D1Store;
  let rawItems: D1ItemComponent[];
  if (raw.id === 'vault') {
    const result = makeVault(raw as D1VaultResponse);
    store = result.store;
    rawItems = result.items;
  } else {
    const result = makeCharacter(raw as D1CharacterResponse, defs, lastPlayedDate);
    store = result.store;
    rawItems = result.items;
  }

  const items = processItems(store, rawItems, defs, buckets);
  store.items = items;
  store.hadErrors = rawItems.length !== items.length;
  return store;
}

/**
 * Find the date of the most recently played character.
 */
function findLastPlayedDate(rawStores: any[]): Date {
  return Object.values(rawStores).reduce((memo, rawStore) => {
    if (rawStore.id === 'vault') {
      return memo;
    }

    const d1 = new Date(rawStore.character.base.characterBase.dateLastPlayed);

    return memo ? (d1 >= memo ? d1 : memo) : d1;
  }, new Date(0));
}
