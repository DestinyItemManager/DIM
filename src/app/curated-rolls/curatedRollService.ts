import { DimStore } from '../inventory/store-types';
import { toCuratedRolls } from './curated-roll-reader';
import { CuratedRoll } from './curatedRoll';
import { D2Item, DimPlug, DimItem } from '../inventory/item-types';

/**
 * An inventory curated roll - for an item instance ID, is the item known to be curated?
 * If it is curated, what perks are the "best"?
 */
export interface InventoryCuratedRoll {
  /** Item's instance ID. */
  id: string;
  /** Is it a curated roll? */
  isCuratedRoll: boolean;
  /** What perks did the curator pick for the item? */
  curatedPerks: number[];
}

/**
 * Is this a weapon or armor plug that we'll consider?
 * This is in place so that we can disregard intrinsics, shaders/cosmetics
 * and other things (like masterworks) which add more variance than we need.
 */
function isWeaponOrArmorMod(plug: DimPlug): boolean {
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

  return plug.plugItem.itemCategoryHashes.some((ich) => ich === 610365472 || ich === 4104513227); // weapon or armor mod
}

/** Is the plug's hash included in the recommended perks from the curated roll? */
function isCuratedPlug(plug: DimPlug, curatedRoll: CuratedRoll): boolean {
  return curatedRoll.recommendedPerks.includes(plug.plugItem.hash);
}

/** Get all of the plugs for this item that match the curated roll. */
function getCuratedPlugs(item: D2Item, curatedRoll: CuratedRoll): number[] {
  if (!item.sockets) {
    return [];
  }

  const curatedPlugs: number[] = [];

  item.sockets.sockets.forEach((s) => {
    if (s.plug) {
      s.plugOptions.forEach((dp) => {
        if (isWeaponOrArmorMod(dp) && isCuratedPlug(dp, curatedRoll)) {
          curatedPlugs.push(dp.plugItem.hash);
        }
      });
    }
  });

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

  return item.sockets.sockets.every(
    (s) =>
      !s.plug ||
      !isWeaponOrArmorMod(s.plug) ||
      s.plugOptions.some((dp) => isCuratedPlug(dp, curatedRoll))
  );
}

/** Get the inventory curated roll for this item (based off of the curated roll). */
function getInventoryCuratedRoll(item: D2Item, curatedRoll: CuratedRoll): InventoryCuratedRoll {
  if (!allDesiredPerksExist(item, curatedRoll)) {
    return getNonCuratedRollIndicator(item);
  }

  return {
    id: item.id,
    isCuratedRoll: true,
    curatedPerks: getCuratedPlugs(item, curatedRoll)
  };
}

function getNonCuratedRollIndicator(item: DimItem): InventoryCuratedRoll {
  return {
    id: item.id,
    isCuratedRoll: false,
    curatedPerks: []
  };
}

export class CuratedRollService {
  curationEnabled: boolean;
  private _curatedRolls: CuratedRoll[];

  /** Get the InventoryCuratedRoll for this item. */
  getInventoryCuratedRoll(item: DimItem): InventoryCuratedRoll {
    if (
      !$featureFlags.curatedRolls ||
      !item.isDestiny2() ||
      !this._curatedRolls ||
      !item ||
      !item.sockets
    ) {
      return getNonCuratedRollIndicator(item);
    }

    if (this._curatedRolls.find((cr) => cr.itemHash === item.hash)) {
      const associatedRolls = this._curatedRolls.filter((cr) => cr.itemHash === item.hash);

      const matchingCuratedRoll = associatedRolls.find((ar) => allDesiredPerksExist(item, ar));

      if (matchingCuratedRoll) {
        return getInventoryCuratedRoll(item, matchingCuratedRoll);
      }
    }
    return getNonCuratedRollIndicator(item);
  }

  /** Get InventoryCuratedRolls for every item in the stores. */
  getInventoryCuratedRolls(stores: DimStore[]): InventoryCuratedRoll[] {
    return stores
      .map((store) => store.items.map((item) => this.getInventoryCuratedRoll(item)))
      .flat();
  }

  /**
   * Fetch curated rolls from the specified location.
   * If we can fetch them, load the curated rolls that it contains (replacing any we may have).
   */
  async fetchCuratedRolls(location: string) {
    if ($featureFlags.curatedRolls) {
      await fetch(`${location}`)
        .then((response) => response.text())
        .then((bansheeText) => {
          this.loadCuratedRolls(bansheeText);
        });
    }

    return this;
  }

  /** Load curated rolls from the following (probably b-44 newline separated) string of text. */
  loadCuratedRolls(bansheeText: string) {
    const curatedRolls = toCuratedRolls(bansheeText);

    if (curatedRolls && curatedRolls.length > 0) {
      this.curationEnabled = true;
      this._curatedRolls = curatedRolls;
    }

    return this;
  }
}

export const dimCuratedRollService = new CuratedRollService();
