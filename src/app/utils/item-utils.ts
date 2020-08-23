import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { DimItem, DimMasterwork, DimSocket } from 'app/inventory/item-types';
import _ from 'lodash';
import modSocketMetadata, { ModSocketMetadata } from 'data/d2/specialty-modslot-metadata';
import powerCapToSeason from 'data/d2/lightcap-to-season.json';
import { objectifyArray } from './util';
import {
  armor2PlugCategoryHashes,
  energyNamesByEnum,
  TOTAL_STAT_HASH,
  CUSTOM_TOTAL_STAT_HASH,
} from 'app/search/d2-known-values';
import { damageNamesByEnum } from 'app/search/search-filter-values';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';

// damage is a mess!
// this function supports turning a destiny DamageType or EnergyType into a known english name
// mainly for most css purposes and the filter names

export const getItemDamageShortName = (item: DimItem): string | undefined =>
  item.isDestiny2() && item.energy
    ? energyNamesByEnum[item.element?.enumValue ?? -1]
    : damageNamesByEnum[item.element?.enumValue ?? -1];

// these are helpers for identifying SpecialtySockets (seasonal mods).
// i would like this file to be the only one that interfaces with
// data/d2/specialty-modslot-metadata.json
// process its data here and export it to thing that needs it

const modMetadataBySocketTypeHash = objectifyArray(modSocketMetadata, 'socketTypeHash');

const modMetadataByPlugCategoryHash = objectifyArray(modSocketMetadata, 'plugCategoryHashes');

/** i.e. ['outlaw', 'forge', 'opulent', etc] */
export const modSlotTags = modSocketMetadata.map((m) => m.tag);

// kind of silly but we are using a list of known mod hashes to identify specialty mod slots below
export const specialtySocketTypeHashes = modSocketMetadata.map(
  (modMetadata) => modMetadata.socketTypeHash
);

export const specialtyModPlugCategoryHashes = modSocketMetadata.flatMap(
  (modMetadata) => modMetadata.compatiblePlugCategoryHashes
);

/** verifies an item is d2 armor and has a specialty mod slot, which is returned */
export const getSpecialtySocket = (item: DimItem): DimSocket | undefined => {
  if (item.isDestiny2() && item.bucket.inArmor) {
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
  item.isDestiny2() ? powerCapToSeason[item.powerCap ?? -99999999] : undefined;

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
