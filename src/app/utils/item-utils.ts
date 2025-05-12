import { factionItemAligns } from 'app/destiny1/d1-factions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
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
import { D1BucketHashes } from 'app/search/d1-known-values';
import {
  ARTIFICE_PERK_HASH,
  armor2PlugCategoryHashes,
  killTrackerObjectivesByHash,
  killTrackerSocketTypeHash,
} from 'app/search/d2-known-values';
import { damageNamesByEnum, riteOfTheNineShinyWeapons } from 'app/search/search-filter-values';
import modSocketMetadata, {
  ModSocketMetadata,
  modTypeTagByPlugCategoryHash,
} from 'app/search/specialty-modslots';
import { DamageType, DestinyClass, DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import artifactBreakerMods from 'data/d2/artifact-breaker-weapon-types.json';
import {
  BreakerTypeHashes,
  BucketHashes,
  ItemCategoryHashes,
  PlugCategoryHashes,
} from 'data/d2/generated-enums';
import { filterMap, objectifyArray } from './collections';

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
  'compatiblePlugCategoryHashes',
);

/** i.e. ['outlaw', 'forge', 'opulent', etc] */
export const modSlotTags = modSocketMetadata.map((m) => m.slotTag);
export const modTypeTags = [...new Set(modSocketMetadata.flatMap((m) => m.compatibleModTags))];

// kind of silly but we are using a list of known mod hashes to identify specialty mod slots below
const specialtySocketTypeHashes = modSocketMetadata.flatMap(
  (modMetadata) => modMetadata.socketTypeHashes,
);

const specialtyModPlugCategoryHashes = modSocketMetadata.flatMap(
  (modMetadata) => modMetadata.compatiblePlugCategoryHashes,
);

/** verifies an item is d2 armor and has one or more specialty mod sockets, which are returned */
const getSpecialtySockets = (item?: DimItem): DimSocket[] | undefined => {
  if (item?.bucket.inArmor) {
    const specialtySockets = item.sockets?.allSockets.filter(
      (socket) =>
        // check plugged -- non-artifice GoA armor still has the socket but nothing in it
        socket.plugged &&
        // exotic armor 2.0 has this socket hidden if not upgraded to artifice armor yet
        socket.visibleInGame &&
        specialtySocketTypeHashes.includes(socket.socketDefinition.socketTypeHash),
    );
    if (specialtySockets?.length) {
      return specialtySockets;
    }
  }
};

/** returns ModMetadatas if the item has one or more specialty mod slots */
export const getSpecialtySocketMetadatas = (item?: DimItem): ModSocketMetadata[] | undefined => {
  const metadatas = filterMap(
    getSpecialtySockets(item) ?? [],
    (s) => modMetadataBySocketTypeHash[s.socketDefinition.socketTypeHash],
  );
  if (metadatas?.length) {
    return metadatas;
  }
};

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
  modTypeTagByPlugCategoryHash[plugCategoryHash as PlugCategoryHashes];

/** feed a **mod** definition into this */
export const isArmor2Mod = (item: DestinyInventoryItemDefinition): boolean =>
  item.plug !== undefined &&
  (armor2PlugCategoryHashes.includes(item.plug.plugCategoryHash) ||
    specialtyModPlugCategoryHashes.includes(item.plug.plugCategoryHash));

/** accepts a DimMasterwork or lack thereof */
export function getMasterworkStatNames(mw: DimMasterwork | null) {
  return mw?.stats
    ?.filter((stat) => stat.isPrimary)
    .map((stat) => stat.name)
    .filter(Boolean)
    .join(', ');
}

/** Can this item be equipped by the given store? */
export function itemCanBeEquippedBy(
  item: DimItem,
  store: DimStore,
  allowPostmaster = false,
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
  allowPostmaster = false,
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
          isClassCompatible(item.classType, storeClassType)) &&
      // can be moved or is already here
      (!item.notransfer || item.owner === storeId) &&
      (allowPostmaster || !item.location.inPostmaster),
  );
}

export function nonPullablePostmasterItem(item: DimItem): boolean {
  return (
    item.owner !== 'unknown' && !item.canPullFromPostmaster && Boolean(item.location.inPostmaster)
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
  socket: DimSocket | undefined,
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
  defs?: D2ManifestDefinitions,
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
      item.sourceHashes.some((hash) => d1YearSourceHashes.year2.includes(hash))
    ) {
      year = 2;
    }
    if (
      !ttk &&
      (item.classified || item.sourceHashes.some((hash) => d1YearSourceHashes.year3.includes(hash)))
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

/** turns an item's list of stats into a dictionary of stats, keyed by stat hash */
export function getStatValuesByHash(item: DimItem, byWhichValue: 'base' | 'value') {
  const output: NodeJS.Dict<number> = {};
  for (const stat of item.stats ?? []) {
    output[stat.statHash] = stat[byWhichValue];
  }
  return output;
}

/**
 * Does this item have access to the Artifice mod slot that allows
 * the user to bump a stat by a small amount?
 */
export function isArtifice(item: DimItem) {
  return Boolean(item.sockets?.allSockets.some(isArtificeSocket));
}

export function isArtificeSocket(socket: DimSocket) {
  // exotic armor has the artifice slot all the time, and it's usable when it's reported as visible
  return Boolean(
    socket.visibleInGame &&
      socket.plugged &&
      // in a better world, you'd only need to check this, because there's a "empty mod slot" item specifically for artifice slots.
      (socket.plugged.plugDef.plug.plugCategoryHash === PlugCategoryHashes.EnhancementsArtifice ||
        // but some of those have the *generic* "empty mod slot" item plugged in, so we fall back to keeping an eye out for the intrinsic
        socket.plugged.plugDef.hash === ARTIFICE_PERK_HASH),
  );
}

/**
 * Are two Destiny classes compatible? e.g. can an item (firstClass) be equipped
 * by a character (secondClass)? True if they're the same class or one is the
 * wildcard class.
 */
export function isClassCompatible(firstClass: DestinyClass, secondClass: DestinyClass) {
  return (
    firstClass === DestinyClass.Unknown ||
    secondClass === DestinyClass.Unknown ||
    firstClass === secondClass
  );
}

/**
 * Can a loadout of classType `loadoutClass` use an item of class `itemClass`?
 * Global loadouts can only include items equippable by any class, so this is
 * more restrictive than `isClassCompatible`
 */
export function isItemLoadoutCompatible(itemClass: DestinyClass, loadoutClass: DestinyClass) {
  return itemClass === DestinyClass.Unknown || itemClass === loadoutClass;
}

/** "shiny" items, special-edition items from Into The Light, with a unique ornament and extra perks */
export function braveShiny(item: DimItem) {
  return item.sockets?.allSockets.some(
    (s) =>
      s.plugOptions.some((s) => s.plugDef.plug.plugCategoryIdentifier === 'holofoil_skins_shared'), //
  );
}

/** Rite of the Nine "shiny" weapons with a unique appearance the the diagonal stripes */
export function riteShiny(item: DimItem) {
  return riteOfTheNineShinyWeapons.has(item.hash);
}

const ichToBreakerType = Object.entries(artifactBreakerMods).reduce<
  Partial<Record<ItemCategoryHashes, BreakerTypeHashes>>
>((memo, [breakerType, iches]) => {
  const breakerTypeNum = parseInt(breakerType, 10);
  for (const ich of iches) {
    memo[ich] = breakerTypeNum;
  }
  return memo;
}, {});

/**
 * Get the effective breaker type of a weapon as granted by the seasonal
 * artifact. This does not include intrinsic breaker types (e.g. on some
 * exotics) so you should check item.breakerType first if you want the effective
 * overall breaker type, as intrinsic breaker beats artifact breaker.
 */
export function getSeasonalBreakerTypeHash(item: DimItem): number | undefined {
  if (item.destinyVersion === 2 && item.bucket.inWeapons && !item.breakerType) {
    for (const ich of item.itemCategoryHashes) {
      if (ichToBreakerType[ich]) {
        return ichToBreakerType[ich];
      }
    }
  }
}

/** The full item type name shown as a subtitle in the item popup. e.g. "Hunter Gauntlets" */
export function itemTypeName(item: DimItem) {
  const classType =
    (item.classType !== DestinyClass.Unknown &&
      // These already include the class name
      item.bucket.hash !== BucketHashes.ClassArmor &&
      item.bucket.hash !== D1BucketHashes.Artifact &&
      item.bucket.hash !== BucketHashes.Subclass &&
      !item.classified &&
      item.classTypeNameLocalized[0].toUpperCase() + item.classTypeNameLocalized.slice(1)) ||
    '';

  const title =
    item.typeName && classType
      ? t('MovePopup.Subtitle.Type', {
          classType,
          typeName: item.typeName,
        })
      : item.typeName || classType;

  if (!title) {
    return null;
  }

  return title;
}
