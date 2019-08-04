import { DimStore } from '../inventory/store-types';
import { toCuratedRolls } from './curated-roll-reader';
import { CuratedRoll, DimWishList } from './curatedRoll';
import { D2Item, DimPlug, DimItem } from '../inventory/item-types';
import _ from 'lodash';

/**
 * An inventory curated roll - for an item instance ID, is the item known to be curated?
 * If it is curated, what perks are the "best"?
 */
export interface InventoryCuratedRoll {
  /** What perks did the curator pick for the item? */
  curatedPerks: Set<number>;
}

let previousCuratedRolls: { [itemHash: number]: CuratedRoll[] } | undefined;
let seenItemIds = new Set<string>();
let inventoryRolls: { [key: string]: InventoryCuratedRoll } = {};

/** Get InventoryCuratedRolls for every item in the stores. */
export function getInventoryCuratedRolls(
  stores: DimStore[],
  rollsByHash: { [itemHash: number]: CuratedRoll[] }
): { [key: string]: InventoryCuratedRoll } {
  if (
    !$featureFlags.curatedRolls ||
    _.isEmpty(rollsByHash) ||
    !stores.length ||
    !stores[0].isDestiny2()
  ) {
    return {};
  }

  if (previousCuratedRolls !== rollsByHash) {
    previousCuratedRolls = rollsByHash;
    seenItemIds = new Set<string>();
    inventoryRolls = {};
  }

  for (const store of stores) {
    for (const item of store.items) {
      if (item.isDestiny2() && item.sockets && !seenItemIds.has(item.id)) {
        const curatedRoll = getInventoryCuratedRoll(item, rollsByHash);
        if (curatedRoll) {
          inventoryRolls[item.id] = curatedRoll;
        }
        seenItemIds.add(item.id);
      }
    }
  }

  return inventoryRolls;
}

/** Load curated rolls from the following (probably b-44 newline separated) string of text. */
export function loadCuratedRolls(text: string) {
  return toCuratedRolls(text);
}

/**
 * Is this a weapon or armor plug that we'll consider?
 * This is in place so that we can disregard intrinsics, shaders/cosmetics
 * and other things (like masterworks) which add more variance than we need.
 */
function isWeaponOrArmorOrGhostMod(plug: DimPlug): boolean {
  if (
    plug.plugItem.itemCategoryHashes.find(
      (ich) =>
        ich === 2237038328 || // intrinsics
        ich === 945330047 || // weapon gameplay socket
        ich === 3851138800 // armor gameplay socket
    )
  ) {
    return false;
  }

  // if it's a modification, ignore it
  if (plug.plugItem.inventory && plug.plugItem.inventory.bucketTypeHash === 3313201758) {
    return false;
  }

  return plug.plugItem.itemCategoryHashes.some(
    (ich) => ich === 610365472 || ich === 4104513227 || ich === 303512563 || ich === 4176831154
  ); // weapon, then armor, then bonus (found on armor perks), then ghost mod
}

/** Is the plug's hash included in the recommended perks from the curated roll? */
function isCuratedPlug(plug: DimPlug, curatedRoll: CuratedRoll): boolean {
  return curatedRoll.recommendedPerks.has(plug.plugItem.hash);
}

/** Get all of the plugs for this item that match the curated roll. */
function getCuratedPlugs(item: D2Item, curatedRoll: CuratedRoll): Set<number> {
  if (!item.sockets) {
    return new Set();
  }

  const curatedPlugs = new Set<number>();

  for (const s of item.sockets.sockets) {
    if (s.plug) {
      for (const dp of s.plugOptions) {
        if (isWeaponOrArmorOrGhostMod(dp) && isCuratedPlug(dp, curatedRoll)) {
          curatedPlugs.add(dp.plugItem.hash);
        }
      }
    }
  }

  return curatedPlugs;
}

/**
 * Do all desired perks from the curated roll exist on this item?
 * Disregards cosmetics and some other socket types.
 */
function allDesiredPerksExist(item: D2Item, curatedRoll: CuratedRoll): boolean {
  if (!item.sockets) {
    return false;
  }

  if (curatedRoll.isExpertMode) {
    for (const rp of curatedRoll.recommendedPerks) {
      if (
        !item.sockets.sockets
          .flatMap((s) => (!s.plugOptions ? [0] : s.plugOptions.map((dp) => dp.plugItem.hash)))
          .includes(rp)
      ) {
        return false;
      }
    }
    return true;
  }

  return item.sockets.sockets.every(
    (s) =>
      !s.plug ||
      !isWeaponOrArmorOrGhostMod(s.plug) ||
      s.plugOptions.some((dp) => isCuratedPlug(dp, curatedRoll))
  );
}

/** Get the InventoryCuratedRoll for this item. */
function getInventoryCuratedRoll(
  item: DimItem,
  curatedRolls: { [itemHash: number]: CuratedRoll[] }
): InventoryCuratedRoll | undefined {
  if (!curatedRolls || !item || !item.isDestiny2() || !item.sockets) {
    return undefined;
  }

  let matchingCuratedRoll: CuratedRoll | undefined;
  // It could be under the item hash, the wildcard, or any of the item's categories
  for (const hash of [item.hash, DimWishList.WildcardItemId, ...item.itemCategoryHashes]) {
    matchingCuratedRoll =
      curatedRolls[hash] && curatedRolls[hash].find((cr) => allDesiredPerksExist(item, cr));
    if (matchingCuratedRoll) {
      break;
    }
  }

  if (matchingCuratedRoll) {
    return {
      curatedPerks: getCuratedPlugs(item, matchingCuratedRoll)
    };
  }

  return undefined;
}
