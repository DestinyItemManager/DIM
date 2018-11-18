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

function isCuratedRoll(item: D2Item, curatedRolls: CuratedRoll[]): boolean {
  if (!item || !item.sockets) {
    return false;
  }

  if (curatedRolls.find((cr) => cr.itemHash === item.hash)) {
    const associatedRolls = curatedRolls.filter((cr) => cr.itemHash === item.hash);

    const matchingCuratedRoll = associatedRolls.find((ar) => allDesiredPerksExist(item, ar));

    if (matchingCuratedRoll) {
      markCuration(item, matchingCuratedRoll);
    }
  }
  return false;
}

function findCuratedRolls(stores: D2Store[], curatedRolls: CuratedRoll[]): void {
  stores.forEach((store) => store.items.forEach((item) => isCuratedRoll(item, curatedRolls)));
}
