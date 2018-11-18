import { D2Store } from '../inventory/store-types';
import { toCuratedRolls } from './curatedRollReader';
import { CuratedRoll } from './curatedRoll';
import { D2Item, DimPlug } from '../inventory/item-types';

export async function selectCuratedRolls(location: string, stores: D2Store[]) {
  await fetch(`${location}`)
    .then((response) => response.text())
    .then((bansheeText) => {
      const curatedRolls = toCuratedRolls(bansheeText);
      findCuratedRolls(stores, curatedRolls);
    });
}

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

function isCuratedRoll(item: D2Item, curatedRolls: CuratedRoll[]): boolean {
  if (!item || !item.sockets) {
    return false;
  }

  if (curatedRolls.find((cr) => cr.itemHash === item.hash)) {
    console.log(item);
    const associatedRolls = curatedRolls.filter((cr) => cr.itemHash === item.hash);
    if (associatedRolls.find((ar) => allDesiredPerksExist(item, ar))) {
      console.log(`${item.name} - ${item.id} - match`);
    }
  }
  return false;
}

function findCuratedRolls(stores: D2Store[], curatedRolls: CuratedRoll[]): void {
  stores.forEach((store) => store.items.forEach((item) => isCuratedRoll(item, curatedRolls)));
}
