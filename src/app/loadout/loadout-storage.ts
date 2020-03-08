import _ from 'lodash';
import { SyncService, DimData } from '../storage/sync.service';
import { DimItem } from '../inventory/item-types';
import * as actions from './actions';
import { LoadoutClass, LoadoutItem, Loadout } from './loadout-types';
import { ThunkResult } from 'app/store/reducers';
import { loadoutsSelector } from './reducer';

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

/** Called when sync service is loaded to populate loadouts in Redux */
export function loadLoadouts(data: DimData): ThunkResult<void> {
  return async (dispatch) => {
    const newLoadouts = 'loadouts-v3.0' in data ? processLoadout(data, 'v3.0') : [];
    if (newLoadouts.length) {
      dispatch(actions.loaded(newLoadouts));
    }
  };
}

export function saveLoadout(loadout: Loadout): ThunkResult<Loadout | undefined> {
  return async (dispatch, getState) => {
    const clashingLoadout = getClashingLoadout(loadoutsSelector(getState()), loadout);

    if (!clashingLoadout) {
      dispatch(actions.updateLoadout(loadout));
      await saveLoadouts(getState().loadouts.loadouts);
    }

    return clashingLoadout;
  };
}

export function deleteLoadout(loadout: Loadout): ThunkResult<void> {
  return async (dispatch, getState) => {
    dispatch(actions.deleteLoadout(loadout.id));

    await SyncService.remove(loadout.id);
    // remove the loadout ID from the list of loadout IDs
    await SyncService.set({
      'loadouts-v3.0': getState().loadouts.loadouts.map((l) => l.id)
    });
  };
}

async function saveLoadouts(loadouts: Loadout[]): Promise<Loadout[]> {
  const loadoutPrimitives = loadouts.map(dehydrate);

  const data = {
    'loadouts-v3.0': loadoutPrimitives.map((l) => l.id),
    ..._.keyBy(loadoutPrimitives, (l) => l.id)
  };

  await SyncService.set(data);
  return loadouts;
}

/** Find other loadouts that have the same name as a proposed new loadout. */
function getClashingLoadout(loadouts: Loadout[], newLoadout: Loadout): Loadout | undefined {
  return loadouts.find(
    (loadout) =>
      loadout.name === newLoadout.name &&
      loadout.id !== newLoadout.id &&
      loadout.classType === newLoadout.classType
  );
}

function processLoadout(data: DimData, version: string): Loadout[] {
  if (!data) {
    return [];
  }

  let loadouts: Loadout[] = [];
  if (version === 'v3.0') {
    const ids = data['loadouts-v3.0'];
    loadouts = ids ? ids.filter((id) => data[id]).map((id) => hydrate(data[id])) : [];
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
    items: loadoutPrimitive.items,
    clearSpace: loadoutPrimitive.clearSpace
  };

  // Blizzard.net is no more, they're all Steam now
  if (result.platform === 'Blizzard') {
    result.platform = 'Steam';
  }

  return result;
}

/** Transform the loadout into its storage format. */
function dehydrate(loadout: Loadout): DehydratedLoadout {
  const items = loadout.items.map((item) => ({
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
