import { D2Store } from '../inventory/store-types';
import { toCuratedRolls } from './curatedRollReader';
import { CuratedRoll } from './curatedRoll';
import { D2Item, DimSocket } from '../inventory/item-types';

export async function selectCuratedRolls(location: string, stores: D2Store[]) {
  await fetch(`${location}`)
    .then((response) => response.text())
    .then((bansheeText) => {
      const curatedRolls = toCuratedRolls(bansheeText);
      findCuratedRolls(stores, curatedRolls);
    });
}

function isSocketWeCareAbout(socket: DimSocket) {
  console.log(socket);
  return true;
}

function isCuratedRoll(item: D2Item, curatedRolls: CuratedRoll[]): boolean {
  if (!item || !item.sockets) {
    return false;
  }

  if (curatedRolls.find((cr) => cr.itemHash === item.hash)) {
    console.log(item);
    item.sockets.sockets.forEach(isSocketWeCareAbout);
    return true;
  }
  return false;
}

function findCuratedRolls(stores: D2Store[], curatedRolls: CuratedRoll[]): void {
  stores.forEach((store) => store.items.forEach((item) => isCuratedRoll(item, curatedRolls)));
}
