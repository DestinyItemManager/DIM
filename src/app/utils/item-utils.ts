import { factionItemAligns } from 'app/destiny1/d1-factions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  D1Item,
  DimItem,
  DimMasterwork,
  DimPlug,
  DimSocket,
  PluggableInventoryItemDefinition,
} from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { getSeason } from 'app/inventory/store/season';
import {
  EXOTIC_CATALYST_TRAIT,
  armor2PlugCategoryHashes,
  killTrackerObjectivesByHash,
  killTrackerSocketTypeHash,
  modsWithConditionalStats,
} from 'app/search/d2-known-values';
import { damageNamesByEnum } from 'app/search/search-filter-values';
import modSocketMetadata, {
  ModSocketMetadata,
  modTypeTagByPlugCategoryHash,
} from 'app/search/specialty-modslots';
import { DamageType, DestinyClass, DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import adeptWeaponHashes from 'data/d2/adept-weapon-hashes.json';
import enhancedIntrinsics from 'data/d2/crafting-enhanced-intrinsics';
import { BucketHashes, StatHashes } from 'data/d2/generated-enums';
import masterworksWithCondStats from 'data/d2/masterworks-with-cond-stats.json';
import _ from 'lodash';
import { objectifyArray } from './util';

// damage is a mess!
// this function supports turning a destiny DamageType into a known english name
// mainly for css purposes and the "is:arc" style filter names

export const getItemDamageShortName = (item: DimItem): string | undefined =>
  damageNamesByEnum[item.element?.enumValue ?? DamageType.None];

// these are helpers for identifying SpecialtySockets (combat style/raid mods). See specialty-modslots.ts

const modMetadataBySocketTypeHash = objectifyArray(modSocketMetadata, 'socketTypeHashes');

// this has weird collisions but good enough for looking up mods with limited PCH compatibility, like raid slots
// it can be used to find what mod metadata a plugged item belongs to
export const modMetadataByPlugCategoryHash = objectifyArray(
  modSocketMetadata,
  'compatiblePlugCategoryHashes'
);

/** i.e. ['outlaw', 'forge', 'opulent', etc] */
export const modSlotTags = modSocketMetadata.map((m) => m.slotTag);
export const modTypeTags = [...new Set(modSocketMetadata.flatMap((m) => m.compatibleModTags))];

// kind of silly but we are using a list of known mod hashes to identify specialty mod slots below
const specialtySocketTypeHashes = modSocketMetadata.flatMap(
  (modMetadata) => modMetadata.socketTypeHashes
);

const specialtyModPlugCategoryHashes = modSocketMetadata.flatMap(
  (modMetadata) => modMetadata.compatiblePlugCategoryHashes
);

export const emptySpecialtySocketHashes = modSocketMetadata.map(
  (modMetadata) => modMetadata.emptyModSocketHash
);

/** verifies an item is d2 armor and has one or more specialty mod sockets, which are returned */
const getSpecialtySockets = (item?: DimItem): DimSocket[] | undefined => {
  if (item?.bucket.inArmor) {
    const specialtySockets = item.sockets?.allSockets.filter(
      (socket) =>
        // check plugged -- non-artifice GoA armor still has the socket but nothing in it
        socket.plugged && specialtySocketTypeHashes.includes(socket.socketDefinition.socketTypeHash)
    );
    if (specialtySockets?.length) {
      return specialtySockets;
    }
  }
};

/** returns ModMetadatas if the item has one or more specialty mod slots */
export const getSpecialtySocketMetadatas = (item?: DimItem): ModSocketMetadata[] | undefined =>
  _.compact(
    getSpecialtySockets(item)?.map(
      (s) => modMetadataBySocketTypeHash[s.socketDefinition.socketTypeHash]
    )
  );

/**
 * combat and legacy slots are boring now. everything has them.
 * this focuses on narrower stuff: raid & nightmare modslots
 */
export const getInterestingSocketMetadatas = (item?: DimItem): ModSocketMetadata[] | undefined => {
  const specialtySockets = getSpecialtySocketMetadatas(item)?.filter((m) => m.slotTag !== 'legacy');
  if (specialtySockets?.length) {
    return specialtySockets;
  }
};

/**
 * returns mod type tag if the plugCategoryHash (from a mod definition's .plug) is known
 */
export const getModTypeTagByPlugCategoryHash = (plugCategoryHash: number): string | undefined =>
  modTypeTagByPlugCategoryHash[plugCategoryHash];

/** feed a **mod** definition into this */
export const isArmor2Mod = (item: DestinyInventoryItemDefinition): boolean =>
  item.plug !== undefined &&
  (armor2PlugCategoryHashes.includes(item.plug.plugCategoryHash) ||
    specialtyModPlugCategoryHashes.includes(item.plug.plugCategoryHash));

/** accepts a DimMasterwork or lack thereof, & always returns a string */
export function getMasterworkStatNames(mw: DimMasterwork | null) {
  return (
    mw?.stats
      ?.map((stat) => stat.name)
      .filter(Boolean)
      .join(', ') ?? ''
  );
}

/**
 * Items that are sunset are always sunset.
 */
export function isSunset(item: DimItem): boolean {
  // 1310 is the last power cap value before sunsetting was sunsetted
  return item.powerCap !== null && item.powerCap < 1310;
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
    itemCanBeEquippedByStoreId(item, store.id, store.classType, allowPostmaster) &&
    (isD1Item(item) ? factionItemAligns(store, item) : true)
  );
}

/** Can this item be equipped by the given (non-vault) store ID? */
export function itemCanBeEquippedByStoreId(
  item: DimItem,
  storeId: string,
  storeClassType: DestinyClass,
  allowPostmaster = false
): boolean {
  return Boolean(
    item.equipment &&
      (item.classified
        ? // we can't trust the classType of redacted items! they're all marked titan.
          // let's assume classified weapons are all-class
          item.bucket.inWeapons ||
          // if it's equipped by this store, it's obviously equippable to this store!
          (item.owner === storeId && item.equipped)
        : // For the right class
          item.classType === DestinyClass.Unknown || item.classType === storeClassType) &&
      // can be moved or is already here
      (!item.notransfer || item.owner === storeId) &&
      (allowPostmaster || !item.location.inPostmaster)
  );
}

/** Could this be added to a loadout? */
export function itemCanBeInLoadout(item: DimItem): boolean {
  return (
    item.equipment ||
    (item.destinyVersion === 1 &&
      (item.bucket.hash === BucketHashes.Consumables ||
        // D1 had a "Material" type
        item.bucket.hash === BucketHashes.Materials))
  );
}

/** verifies an item has kill tracker mod slot, which is returned */
const getKillTrackerSocket = (item: DimItem): DimSocket | undefined => {
  if (item.bucket.inWeapons) {
    return item.sockets?.allSockets.find(isEnabledKillTrackerSocket);
  }
};

/** Is this both a kill tracker socket, and the kill tracker is enabled? */
function isEnabledKillTrackerSocket(socket: DimSocket) {
  return (socket.plugged?.plugObjectives[0]?.objectiveHash ?? 0) in killTrackerObjectivesByHash;
}

/** Is this a kill tracker socket */
export function isKillTrackerSocket(socket: DimSocket) {
  return socket.socketDefinition.socketTypeHash === killTrackerSocketTypeHash;
}

export interface KillTracker {
  type: 'pve' | 'pvp' | 'gambit';
  count: number;
  trackerDef: PluggableInventoryItemDefinition;
}

/** returns a socket's kill tracker info */
const getSocketKillTrackerInfo = (
  socket: DimSocket | undefined
): KillTracker | null | undefined => {
  const killTrackerPlug = socket?.plugged;
  return killTrackerPlug && plugToKillTracker(killTrackerPlug);
};

export function plugToKillTracker(killTrackerPlug: DimPlug) {
  const type = killTrackerObjectivesByHash[killTrackerPlug.plugObjectives[0]?.objectiveHash];
  const count = killTrackerPlug.plugObjectives[0]?.progress;
  if (type && count !== undefined) {
    return {
      type,
      count,
      trackerDef: killTrackerPlug.plugDef,
    };
  }
}

/** returns an item's kill tracker info */
export const getItemKillTrackerInfo = (item: DimItem): KillTracker | null | undefined =>
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
export function getItemYear(
  item: DimItem | DestinyInventoryItemDefinition,
  defs?: D2ManifestDefinitions
) {
  if (('destinyVersion' in item && item.destinyVersion === 2) || 'displayProperties' in item) {
    const season = getSeason(item, defs);
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
 * This function indicates whether a mod's stat effect is active on the item.
 *
 * For example, some subclass plugs reduce a different stat per character class,
 * which we identify using the passed subclass item.
 *
 * If the plugHash isn't recognized then the default is to return true.
 */
export function isPlugStatActive(
  item: DimItem,
  plug: DestinyInventoryItemDefinition,
  statHash: number,
  isConditionallyActive: boolean
): boolean {
  /*
  Some Exotic weapon catalysts can be inserted even though the catalyst objectives are incomplete.
  In these cases, the catalyst effects are only applied once the objectives are complete.
  We'll assume that the item can only be masterworked if its associated catalyst has been completed.
  */
  if (plug.traitHashes?.includes(EXOTIC_CATALYST_TRAIT) && !item.masterwork) {
    return false;
  }

  if (!isConditionallyActive) {
    return true;
  }

  const plugHash = plug.hash;
  if (
    plugHash === modsWithConditionalStats.elementalCapacitor ||
    plugHash === modsWithConditionalStats.enhancedElementalCapacitor
  ) {
    return false;
  }

  if (
    plugHash === modsWithConditionalStats.echoOfPersistence ||
    plugHash === modsWithConditionalStats.sparkOfFocus
  ) {
    // "-10 to the stat that governs your class ability recharge"
    return (
      (item.classType === DestinyClass.Hunter && statHash === StatHashes.Mobility) ||
      (item.classType === DestinyClass.Titan && statHash === StatHashes.Resilience) ||
      (item.classType === DestinyClass.Warlock && statHash === StatHashes.Recovery)
    );
  }
  if (masterworksWithCondStats.includes(plugHash)) {
    return adeptWeaponHashes.includes(item.hash);
  }
  if (enhancedIntrinsics.has(plugHash)) {
    // Crafted weapons get bonus stats from enhanced intrinsics at Level 20+.
    // The number 20 isn't in the definitions, so just hardcoding it here.
    return (item.craftedInfo?.level || 0) >= 20;
  }
  return true;
}

/**
 * Is this item a Destiny 1 item? Use this when you want the item to
 * automatically be typed as D1 item in the "true" branch of a conditional.
 * Otherwise you can just check "destinyVersion === 1".
 */
export function isD1Item(item: DimItem): item is D1Item {
  return item.destinyVersion === 1;
}

/** turns an item's list of stats into a dictionary of stats, keyed by stat hash */
export function getStatValuesByHash(item: DimItem, byWhichValue: 'base' | 'value') {
  const output: NodeJS.Dict<number> = {};
  for (const stat of item.stats ?? []) {
    output[stat.statHash] = stat[byWhichValue];
  }
  return output;
}
