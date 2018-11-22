import { DimStore } from '../inventory/store-types';
import { toCuratedRolls } from './curatedRollReader';
import { CuratedRoll } from './curatedRoll';
import { D2Item, DimPlug, DimItem } from '../inventory/item-types';

export interface InventoryCuratedRoll {
  id: string;
  isCuratedRoll: boolean;
  curatedPerks: number[];
}

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

function isCuratedPlug(plug: DimPlug, curatedRoll: CuratedRoll): boolean {
  return curatedRoll.recommendedPerks.includes(plug.plugItem.hash);
}

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

  getInventoryCuratedRolls(stores: DimStore[]): InventoryCuratedRoll[] {
    return stores
      .map((store) => store.items.map((item) => this.getInventoryCuratedRoll(item)))
      .flat();
  }

  async selectCuratedRolls(location: string) {
    if ($featureFlags.curatedRolls) {
      await fetch(`${location}`)
        .then((response) => response.text())
        .then((bansheeText) => {
          const curatedRolls = toCuratedRolls(bansheeText);

          if (curatedRolls && curatedRolls.length > 0) {
            this.curationEnabled = true;
            this._curatedRolls = curatedRolls;
          }
        });
    }

    return this;
  }
}

export const dimCuratedRollService = new CuratedRollService();
