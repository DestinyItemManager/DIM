import { D2Store } from '../inventory/store-types';
import { toCuratedRolls } from './curatedRollReader';
import { CuratedRoll } from './curatedRoll';
import { D2Item, DimPlug } from '../inventory/item-types';

function isWeaponOrArmorMod(plug: DimPlug): boolean {
  return plug.plugItem.itemCategoryHashes.some((ich) => ich === 610365472 || ich === 4104513227);
}

function allDesiredPerksExist(item: D2Item, curatedRoll: CuratedRoll): boolean {
  if (!item.sockets) {
    return false;
  }

  return item.sockets.sockets.every(
    (s) =>
      !s.plug ||
      !isWeaponOrArmorMod(s.plug) ||
      s.plugOptions.some((dp) => curatedRoll.recommendedPerks.includes(dp.plugItem.hash))
  );
}

function markCuration(item: D2Item, curatedRoll: CuratedRoll) {
  if (!item.sockets) {
    return;
  }

  item.isCuratedRoll = true;

  item.sockets.sockets.forEach((s) =>
    s.plugOptions.forEach((po) => {
      if (s.plug && curatedRoll.recommendedPerks.includes(po.plugItem.hash)) {
        s.plug.isCurated = true;
      }
    })
  );
}

export class CuratedRollService {
  curationEnabled: boolean;
  private _curatedRolls: CuratedRoll[];

  isCuratedRoll(item: D2Item): boolean {
    if (!item || !item.sockets) {
      return false;
    }

    if (this._curatedRolls.find((cr) => cr.itemHash === item.hash)) {
      const associatedRolls = this._curatedRolls.filter((cr) => cr.itemHash === item.hash);

      const matchingCuratedRoll = associatedRolls.find((ar) => allDesiredPerksExist(item, ar));

      if (matchingCuratedRoll) {
        markCuration(item, matchingCuratedRoll);
        return true;
      }
    }
    return false;
  }

  findCuratedRolls(stores: D2Store[]): void {
    stores.forEach((store) => store.items.forEach((item) => this.isCuratedRoll(item)));
  }

  async selectCuratedRolls(location: string) {
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
}

export const dimCuratedRollService = new CuratedRollService();
