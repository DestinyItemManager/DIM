import _ from 'lodash';
import { SyncService, DimData } from '../storage/sync.service';
import { DimItem } from '../inventory/item-types';
import * as actions from './actions';
import { LoadoutItem, Loadout } from './loadout-types';
import { ThunkResult } from 'app/store/reducers';
import { loadoutsSelector } from './reducer';
import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { accountsSelector } from 'app/accounts/reducer';
import { DestinyAccount, PLATFORM_LABEL_TO_MEMBERSHIP_TYPE } from 'app/accounts/destiny-account';

/** This is the enum loadouts have been stored with - it does not align with DestinyClass */
const enum LoadoutClass {
  any = -1,
  warlock = 0,
  titan = 1,
  hunter = 2
}

const loadoutClassToClassType = {
  [LoadoutClass.warlock]: DestinyClass.Warlock,
  [LoadoutClass.titan]: DestinyClass.Titan,
  [LoadoutClass.hunter]: DestinyClass.Hunter,
  [LoadoutClass.any]: DestinyClass.Unknown
};

const classTypeToLoadoutClass = {
  [DestinyClass.Titan]: LoadoutClass.titan,
  [DestinyClass.Hunter]: LoadoutClass.hunter,
  [DestinyClass.Warlock]: LoadoutClass.warlock,
  [DestinyClass.Unknown]: LoadoutClass.any
};

/** The format loadouts are stored in. */
interface DehydratedLoadout {
  id: string;
  classType: LoadoutClass;
  name: string;
  items: LoadoutItem[];
  destinyVersion?: DestinyVersion;
  /** Platform membership ID this loadout is associated with */
  membershipId?: string;
  platform?: string;
  /** Whether to move other items not in the loadout off the character when applying the loadout. */
  clearSpace?: boolean;
  version: 'v3.0';
}

/** Called when sync service is loaded to populate loadouts in Redux */
export function loadLoadouts(data: DimData): ThunkResult {
  return async (dispatch) => {
    const newLoadouts = 'loadouts-v3.0' in data ? processLoadout(data) : [];
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
      // By this point we should have accounts!
      await saveLoadouts(getState().loadouts.loadouts, accountsSelector(getState()));
    }

    return clashingLoadout;
  };
}

export function deleteLoadout(loadout: Loadout): ThunkResult {
  return async (dispatch, getState) => {
    dispatch(actions.deleteLoadout(loadout.id));

    await SyncService.remove(loadout.id);
    // remove the loadout ID from the list of loadout IDs
    await SyncService.set({
      'loadouts-v3.0': getState().loadouts.loadouts.map((l) => l.id)
    });
  };
}

async function saveLoadouts(
  loadouts: Loadout[],
  accounts: readonly DestinyAccount[]
): Promise<Loadout[]> {
  // This re-serializes every loadout. It doesn't have to... but it does
  const loadoutPrimitives = loadouts.map((loadout) => convertToStorageFormat(loadout, accounts));

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
      (loadout.classType === newLoadout.classType || loadout.classType === DestinyClass.Unknown)
  );
}

function processLoadout(data: DimData): Loadout[] {
  if (!data) {
    return [];
  }

  const ids = data['loadouts-v3.0'];
  const loadouts: Loadout[] = ids
    ? ids.filter((id) => data[id]).map((id) => convertToInMemoryFormat(data[id]))
    : [];

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

/** Read the storage format of a loadout into the in-memory format. */
function convertToInMemoryFormat(loadoutPrimitive: DehydratedLoadout): Loadout {
  const result: Loadout = {
    id: loadoutPrimitive.id,
    name: loadoutPrimitive.name,
    platform: loadoutPrimitive.platform,
    membershipId: loadoutPrimitive.membershipId,
    destinyVersion: loadoutPrimitive.destinyVersion || 1,
    classType:
      loadoutClassToClassType[
        loadoutPrimitive.classType === undefined ? -1 : loadoutPrimitive.classType
      ],
    items: loadoutPrimitive.items.map((item) => ({
      id: item.id || '0',
      hash: item.hash,
      amount: item.amount || 1,
      equipped: Boolean(item.equipped)
    })),
    clearSpace: loadoutPrimitive.clearSpace
  };

  // Blizzard.net is no more, they're all Steam now
  if (result.platform === 'Blizzard') {
    result.platform = 'Steam';
  }

  return result;
}

/** Transform the loadout into its storage format. */
function convertToStorageFormat(
  loadout: Loadout,
  accounts: readonly DestinyAccount[]
): DehydratedLoadout {
  const items = loadout.items.map((item) => ({
    id: item.id,
    hash: item.hash,
    amount: item.amount,
    equipped: item.equipped
  })) as DimItem[];

  // Try to fix up the membership IDs of old accounts.
  // We do this on save instead of on load because we may load loadouts before loading accounts.
  if (!loadout.membershipId) {
    const accountForPlatform = accounts.find((account) =>
      loadout.platform
        ? account.platforms.includes(PLATFORM_LABEL_TO_MEMBERSHIP_TYPE[loadout.platform])
        : account.destinyVersion === loadout.destinyVersion
    );
    loadout.membershipId = accountForPlatform?.membershipId;
  }

  return {
    id: loadout.id,
    name: loadout.name,
    classType: classTypeToLoadoutClass[loadout.classType],
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
