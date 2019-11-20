import copy from 'fast-copy';
import _ from 'lodash';
import { SyncService } from '../storage/sync.service';
import { DimItem } from '../inventory/item-types';
import { DimStore, StoreServiceType } from '../inventory/store-types';
import { D2StoresService } from '../inventory/d2-stores';
import { D1StoresService } from '../inventory/d1-stores';
import { dimItemService, MoveReservations } from '../inventory/item-move-service';
import { t } from 'app/i18next-t';
import { default as reduxStore } from '../store/store';
import * as actions from './actions';
import { loadoutsSelector } from './reducer';
import { showNotification } from '../notifications/notifications';
import { LoadoutClass, LoadoutItem, Loadout } from './loadout-types';

/** The format loadouts are stored in. */
interface DehydratedLoadout {
  id: string;
  classType: LoadoutClass;
  name: string;
  items: LoadoutItem[];
  destinyVersion?: 1 | 2;
  /** Platform membership ID this loadout is associated with */
  membershipId?: string;
  platform?: string;
  /** Whether to move other items not in the loadout off the character when applying the loadout. */
  clearSpace?: boolean;
  version: 'v3.0';
}

export async function getLoadouts(getLatest = false): Promise<Loadout[]> {
  const loadouts = loadoutsSelector(reduxStore.getState());
  // Avoids the hit going to data store if we have data already.
  if (!getLatest && loadouts.length) {
    return loadouts;
  }

  const data = await SyncService.get();
  const newLoadouts = 'loadouts-v3.0' in data ? processLoadout(data, 'v3.0') : [];
  if (getLatest || newLoadouts.length) {
    reduxStore.dispatch(actions.loaded(newLoadouts));
  }
  return loadoutsSelector(reduxStore.getState());
}

export async function saveLoadouts(loadouts: Loadout[]): Promise<Loadout[]> {
  const loadoutPrimitives = loadouts.map(dehydrate);

  const data = {
    'loadouts-v3.0': loadoutPrimitives.map((l) => l.id),
    ..._.keyBy(loadoutPrimitives, (l) => l.id)
  };

  await SyncService.set(data);
  return loadouts;
}

export async function saveLoadout(loadout: Loadout): Promise<Loadout | undefined> {
  const loadouts = await getLoadouts();
  const clashingLoadout = getClashingLoadout(loadouts, loadout);

  if (!clashingLoadout) {
    reduxStore.dispatch(actions.updateLoadout(loadout));
    await saveLoadouts(reduxStore.getState().loadouts.loadouts);
  }

  return clashingLoadout;
}

export async function deleteLoadout(loadout: Loadout): Promise<void> {
  await getLoadouts(); // make sure we have loaded all loadouts first!
  reduxStore.dispatch(actions.deleteLoadout(loadout.id));
  await SyncService.remove(loadout.id);
  await saveLoadouts(reduxStore.getState().loadouts.loadouts);
}

/** Find other loadouts that have the same name as a proposed new loadout. */
export function getClashingLoadout(loadouts: Loadout[], newLoadout: Loadout): Loadout | undefined {
  return loadouts.find(
    (loadout) =>
      loadout.name === newLoadout.name &&
      loadout.id !== newLoadout.id &&
      loadout.classType === newLoadout.classType
  );
}

function getStoresService(destinyVersion) {
  // TODO: this needs to use account, store, or item version
  return destinyVersion === 2 ? D2StoresService : D1StoresService;
}

function processLoadout(data, version): Loadout[] {
  if (!data) {
    return [];
  }

  let loadouts: Loadout[] = [];
  if (version === 'v3.0') {
    const ids = data['loadouts-v3.0'];
    loadouts = ids.filter((id) => data[id]).map((id) => hydrate(data[id]));
  }

  const objectTest = (item) => _.isObject(item) && !(Array.isArray(item) || _.isFunction(item));
  const hasGuid = (item) => _.has(item, 'id') && isGuid(item.id);
  const loadoutGuids = new Set(loadouts.map((i) => i.id));
  const containsLoadoutGuids = (item) => loadoutGuids.has(item.id);

  const orphanIds = Object.values(data)
    .filter((item) => objectTest(item) && hasGuid(item) && !containsLoadoutGuids(item))
    .map((i: DehydratedLoadout) => i.id);

  if (orphanIds.length > 0) {
    SyncService.remove(orphanIds);
  }

  return loadouts;
}

function hydrate(loadoutData: DehydratedLoadout): Loadout {
  const hydration = {
    'v3.0': hydratev3d0
  };

  return hydration[loadoutData.version](loadoutData);
}

/** Read the storage format of a loadout into the in-memory format. */
function hydratev3d0(loadoutPrimitive: DehydratedLoadout): Loadout {
  const result: Loadout = {
    id: loadoutPrimitive.id,
    name: loadoutPrimitive.name,
    platform: loadoutPrimitive.platform,
    membershipId: loadoutPrimitive.membershipId,
    destinyVersion: loadoutPrimitive.destinyVersion,
    classType: loadoutPrimitive.classType === undefined ? -1 : loadoutPrimitive.classType,
    items: {
      unknown: []
    },
    clearSpace: loadoutPrimitive.clearSpace
  };

  // Blizzard.net is no more, they're all Steam now
  if (result.platform === 'Blizzard') {
    result.platform = 'Steam';
  }

  for (const itemPrimitive of loadoutPrimitive.items) {
    const item = copy(
      getStoresService(result.destinyVersion).getItemAcrossStores({
        id: itemPrimitive.id,
        hash: itemPrimitive.hash
      })
    );

    if (item) {
      const discriminator = item.type.toLowerCase();

      item.equipped = itemPrimitive.equipped;

      item.amount = itemPrimitive.amount;

      result.items[discriminator] = result.items[discriminator] || [];
      result.items[discriminator].push(item);
    } else {
      const loadoutItem = {
        id: itemPrimitive.id,
        hash: itemPrimitive.hash,
        amount: itemPrimitive.amount,
        equipped: itemPrimitive.equipped
      };

      result.items.unknown.push(loadoutItem as DimItem);
    }
  }

  return result;
}

/** Transform the loadout into its storage format. */
function dehydrate(loadout: Loadout): DehydratedLoadout {
  const allItems = Object.values(loadout.items).flat();
  const items = allItems.map((item) => ({
    id: item.id,
    hash: item.hash,
    amount: item.amount,
    equipped: item.equipped
  })) as DimItem[];

  return {
    id: loadout.id,
    name: loadout.name,
    classType: loadout.classType,
    version: 'v3.0',
    platform: loadout.platform,
    membershipId: loadout.membershipId,
    destinyVersion: loadout.destinyVersion,
    clearSpace: loadout.clearSpace,
    items
  };
}

function isGuid(stringToTest: string) {
  if (!stringToTest || !stringToTest.length) {
    return false;
  }

  if (stringToTest[0] === '{') {
    stringToTest = stringToTest.substring(1, stringToTest.length - 1);
  }

  const regexGuid = /^(\{){0,1}[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(\}){0,1}$/gi;

  return regexGuid.test(stringToTest);
}

const outOfSpaceWarning = _.throttle((store) => {
  showNotification({
    type: 'info',
    title: t('FarmingMode.OutOfRoomTitle'),
    body: t('FarmingMode.OutOfRoom', { character: store.name })
  });
}, 60000);

/**
 * Move a list of items off of a character to the vault (or to other characters if the vault is full).
 *
 * Shows a warning if there isn't any space.
 */
export async function clearItemsOffCharacter(
  store: DimStore,
  items: DimItem[],
  reservations: MoveReservations,
  storesService: StoreServiceType
) {
  for (const item of items) {
    try {
      // Move a single item. We reevaluate each time in case something changed.
      const vault = storesService.getVault()!;
      const vaultSpaceLeft = vault.spaceLeftForItem(item);
      if (vaultSpaceLeft <= 1) {
        // If we're down to one space, try putting it on other characters
        const otherStores = storesService
          .getStores()
          .filter((s) => !s.isVault && s.id !== store.id);
        const otherStoresWithSpace = otherStores.filter((store) => store.spaceLeftForItem(item));

        if (otherStoresWithSpace.length) {
          if ($featureFlags.debugMoves) {
            console.log(
              'clearItemsOffCharacter initiated move:',
              item.amount,
              item.name,
              item.type,
              'to',
              otherStoresWithSpace[0].name,
              'from',
              storesService.getStore(item.owner)!.name
            );
          }
          await dimItemService.moveTo(
            item,
            otherStoresWithSpace[0],
            false,
            item.amount,
            items,
            reservations
          );
          continue;
        } else if (vaultSpaceLeft === 0) {
          outOfSpaceWarning(store);
          continue;
        }
      }
      if ($featureFlags.debugMoves) {
        console.log(
          'clearItemsOffCharacter initiated move:',
          item.amount,
          item.name,
          item.type,
          'to',
          vault.name,
          'from',
          storesService.getStore(item.owner)!.name
        );
      }
      await dimItemService.moveTo(item, vault, false, item.amount, items, reservations);
    } catch (e) {
      if (e.code === 'no-space') {
        outOfSpaceWarning(store);
      } else {
        showNotification({ type: 'error', title: item.name, body: e.message });
      }
    }
  }
}
