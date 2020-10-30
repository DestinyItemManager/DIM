import { factionItemAligns } from 'app/destiny1/d1-factions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  D1Item,
  DimItem,
  DimMasterwork,
  DimSocket,
  PluggableInventoryItemDefinition,
} from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { getSeason } from 'app/inventory/store/season';
import {
  armor2PlugCategoryHashes,
  CUSTOM_TOTAL_STAT_HASH,
  energyNamesByEnum,
  killTrackerObjectivesByHash,
  TOTAL_STAT_HASH,
} from 'app/search/d2-known-values';
import { damageNamesByEnum } from 'app/search/search-filter-values';
import { DestinyClass, DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import powerCapToSeason from 'data/d2/lightcap-to-season.json';
import modSocketMetadata, { ModSocketMetadata } from 'data/d2/specialty-modslot-metadata';
import _ from 'lodash';
import { objectifyArray } from './util';

// damage is a mess!
// this function supports turning a destiny DamageType or EnergyType into a known english name
// mainly for most css purposes and the filter names

export const getItemDamageShortName = (item: DimItem): string | undefined =>
  item.energy
    ? energyNamesByEnum[item.element?.enumValue ?? -1]
    : damageNamesByEnum[item.element?.enumValue ?? -1];

// these are helpers for identifying SpecialtySockets (seasonal mods).
// i would like this file to be the only one that interfaces with
// data/d2/specialty-modslot-metadata.json
// process its data here and export it to thing that needs it

const modMetadataBySocketTypeHash = objectifyArray(modSocketMetadata, 'socketTypeHash');

const modMetadataByPlugCategoryHash = objectifyArray(modSocketMetadata, 'plugCategoryHashes');

export const modMetadataByTag = objectifyArray(modSocketMetadata, 'tag');

/** i.e. ['outlaw', 'forge', 'opulent', etc] */
export const modSlotTags = modSocketMetadata.map((m) => m.tag);

// kind of silly but we are using a list of known mod hashes to identify specialty mod slots below
export const specialtySocketTypeHashes = modSocketMetadata.map(
  (modMetadata) => modMetadata.socketTypeHash
);

export const specialtyModPlugCategoryHashes = modSocketMetadata.flatMap(
  (modMetadata) => modMetadata.compatiblePlugCategoryHashes
);

export const emptySpecialtySocketHashes = modSocketMetadata.map(
  (modMetadata) => modMetadata.emptyModSocketHash
);

/** verifies an item is d2 armor and has a specialty mod slot, which is returned */
export const getSpecialtySocket = (item: DimItem): DimSocket | undefined => {
  if (item.bucket.inArmor) {
    return item.sockets?.allSockets.find((socket) =>
      specialtySocketTypeHashes.includes(socket.socketDefinition.socketTypeHash)
    );
  }
};

/** returns ModMetadata if the item has a specialty mod slot */
export const getSpecialtySocketMetadata = (item: DimItem): ModSocketMetadata | undefined =>
  modMetadataBySocketTypeHash[
    getSpecialtySocket(item)?.socketDefinition.socketTypeHash || -99999999
  ];

/**
 * returns ModMetadata if the plugCategoryHash (from a mod definition's .plug) is known
 *
 * if you use this you can only trust the returned season, tag, and emptyModSocketHash
 */
export const getSpecialtySocketMetadataByPlugCategoryHash = (
  plugCategoryHash: number
): ModSocketMetadata | undefined => modMetadataByPlugCategoryHash[plugCategoryHash];

/**
 * this always returns a string for easy printing purposes
 *
 * `''` if not found, so you can let it stay blank or `||` it
 */
export const getItemSpecialtyModSlotDisplayName = (
  item: DimItem,
  defs: D2ManifestDefinitions
): string => {
  const emptyModSocketHash = getSpecialtySocketMetadata(item)?.emptyModSocketHash;
  return (
    (emptyModSocketHash && defs.InventoryItem.get(emptyModSocketHash).itemTypeDisplayName) || ''
  );
};

/** feed a **mod** definition into this */
export const isArmor2Mod = (item: DestinyInventoryItemDefinition): boolean =>
  item.plug !== undefined &&
  (armor2PlugCategoryHashes.includes(item.plug.plugCategoryHash) ||
    specialtyModPlugCategoryHashes.includes(item.plug.plugCategoryHash));

/** given item, get the final season it will be relevant (able to hit max power level) */
export const getItemPowerCapFinalSeason = (item: DimItem): number | undefined =>
  item.powerCap ? powerCapToSeason[item.powerCap ?? -99999999] : undefined;

/** accepts a DimMasterwork or lack thereof, & always returns a string */
export function getMasterworkStatNames(mw: DimMasterwork | null) {
  return (
    mw?.stats
      ?.map((stat) => stat.name)
      .filter(Boolean)
      .join(', ') ?? ''
  );
}

export function getPossiblyIncorrectStats(item: DimItem): string[] {
  const incorrect: Set<string> = new Set();
  const stats = item.stats;

  if (stats) {
    for (const stat of stats) {
      if (
        stat.statHash !== TOTAL_STAT_HASH &&
        stat.statHash !== CUSTOM_TOTAL_STAT_HASH &&
        stat.baseMayBeWrong &&
        stat.displayProperties.name
      ) {
        incorrect.add(stat.displayProperties.name);
      }
    }
  }
  return [...incorrect];
}

/**
 * "Instanced" items are uniquely identifiable by an id, while "uninstanced" items don't have any such
 * identifier even though there may be multiple of them in a given location.
 */
export function itemIsInstanced(item: DimItem): boolean {
  return item.id !== '0';
}

/** Can this item be equipped by the given store? */
export function itemCanBeEquippedBy(
  item: DimItem,
  store: DimStore,
  allowPostmaster = false
): boolean {
  if (store.isVault) {
    return false;
  }

  return (
    item.equipment &&
    // For the right class
    (item.classType === DestinyClass.Unknown || item.classType === store.classType) &&
    // nothing we are too low-level to equip
    item.equipRequiredLevel <= store.level &&
    // can be moved or is already here
    (!item.notransfer || item.owner === store.id) &&
    (allowPostmaster || !item.location.inPostmaster) &&
    (isD1Item(item) ? factionItemAligns(store, item) : true)
  );
}

/** Can this item be equipped by the given (non-vault) store ID? */
export function itemCanBeEquippedByStoreId(
  item: DimItem,
  storeId: string,
  storeClassType: DestinyClass
): boolean {
  return (
    item.equipment &&
    // For the right class
    (item.classType === DestinyClass.Unknown || item.classType === storeClassType) &&
    // can be moved or is already here
    (!item.notransfer || item.owner === storeId) &&
    !item.location.inPostmaster
  );
}

/** Could this be added to a loadout? */
export function itemCanBeInLoadout(item: DimItem): boolean {
  return (
    item.equipment ||
    (item.destinyVersion === 1 &&
      (item.type === 'Consumables' ||
        // D1 had a "Material" type
        item.type === 'Material'))
  );
}

/** verifies an item has kill tracker mod slot, which is returned */
const getKillTrackerSocket = (item: DimItem): DimSocket | undefined => {
  if (item.bucket.inWeapons) {
    return item.sockets?.allSockets.find(isKillTrackerSocket);
  }
};

/** Is this both a kill tracker socket, and the kill tracker is enabled? */
export function isKillTrackerSocket(socket: DimSocket) {
  return (socket.plugged?.plugObjectives[0]?.objectiveHash ?? 0) in killTrackerObjectivesByHash;
}

export type KillTracker = {
  type: 'pve' | 'pvp';
  count: number;
  trackerDef: PluggableInventoryItemDefinition;
};

/** returns a socket's kill tracker info */
const getSocketKillTrackerInfo = (socket: DimSocket | undefined): KillTracker | undefined => {
  const installedKillTracker = socket?.plugged;
  if (installedKillTracker) {
    // getKillTrackerSocket's find() ensures that objectiveHash is in killTrackerObjectivesByHash
    const type = killTrackerObjectivesByHash[installedKillTracker.plugObjectives[0].objectiveHash];
    const count = installedKillTracker.plugObjectives[0]?.progress;
    if (type && count !== undefined) {
      return {
        type,
        count,
        trackerDef: installedKillTracker.plugDef,
      };
    }
  }
};

/** returns an item's kill tracker info */
export const getItemKillTrackerInfo = (item: DimItem): KillTracker | undefined =>
  getSocketKillTrackerInfo(getKillTrackerSocket(item));

const d1YearSourceHashes = {
  //         tTK       Variks        CoE         FoTL    Kings Fall
  year2: [2659839637, 512830513, 1537575125, 3475869915, 1662673928],
  //         RoI       WoTM         FoTl       Dawning    Raid Reprise
  year3: [2964550958, 4160622434, 3475869915, 3131490494, 4161861381],
};

/**
 * Which "Year" of Destiny did this item come from?
 */
export function getItemYear(item: DimItem) {
  if (item.destinyVersion === 2) {
    const season = getSeason(item);
    return season ? Math.floor(season / 4) + 1 : 0;
  } else if (isD1Item(item)) {
    if (!item.sourceHashes) {
      return 1;
    }

    // determine what year this item came from based on sourceHash value
    // items will hopefully be tagged as follows
    // No value: Vanilla, Crota's End, House of Wolves
    // The Taken King (year 2): 460228854
    // Rise of Iron (year 3): 24296771
    // if sourceHash doesn't contain these values, we assume they came from
    // year 1

    let year = 1;
    const ttk = item.sourceHashes.includes(d1YearSourceHashes.year2[0]);
    if (
      ttk ||
      item.infusable ||
      _.intersection(d1YearSourceHashes.year2, item.sourceHashes).length
    ) {
      year = 2;
    }
    const roi = item.sourceHashes.includes(d1YearSourceHashes.year3[0]);
    if (
      !ttk &&
      (item.classified || roi || _.intersection(d1YearSourceHashes.year3, item.sourceHashes).length)
    ) {
      year = 3;
    }

    return year;
  } else {
    return undefined;
  }
}

/**
 * Is this item a Destiny 1 item? Use this when you want the item to
 * automatically be typed as D1 item in the "true" branch of a conditional.
 * Otherwise you can just check "destinyVersion === 1".
 */
export function isD1Item(item: DimItem): item is D1Item {
  return item.destinyVersion === 1;
}
