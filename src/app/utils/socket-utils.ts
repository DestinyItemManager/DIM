import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import { DimSocketCategory } from 'app/inventory/item-types';
import { DimSockets, DimSocket } from '../inventory/item-types';
import { isArmor2Mod } from './item-utils';

export function getMasterworkSocketHashes(
  itemSockets: DimSockets,
  style: DestinySocketCategoryStyle
): number[] {
  const masterworkSocketCategory = itemSockets.categories.find(
    (category) => category.category.categoryStyle === style
  );

  return (masterworkSocketCategory && getPlugHashesFromCategory(masterworkSocketCategory)) || [];
}

function getPlugHashesFromCategory(category: DimSocketCategory) {
  return category.sockets
    .map((socket) => socket?.plugged?.plugDef?.hash ?? NaN)
    .filter((val) => !isNaN(val));
}

export function getSocketsWithStyle(
  sockets: DimSockets,
  style: DestinySocketCategoryStyle
): DimSocket[] {
  const masterworkSocketHashes = getMasterworkSocketHashes(sockets, style);
  return sockets.allSockets.filter(
    (socket) => socket.plugged && masterworkSocketHashes.includes(socket.plugged.plugDef.hash)
  );
}

export function getSocketsWithPlugCategoryHash(sockets: DimSockets, categoryHash: number) {
  return sockets.allSockets.filter((socket) =>
    socket?.plugged?.plugDef?.itemCategoryHashes?.includes(categoryHash)
  );
}

/** whether a socket is a mod socket. i.e. those grey things. not perks, not reusables, not shaders */
export function isModSocket(socket: DimSocket) {
  return socket.plugged && isArmor2Mod(socket.plugged.plugDef);
}

/** isModSocket and contains its default plug */
export function isEmptyModSocket(socket: DimSocket) {
  return (
    isModSocket(socket) &&
    socket.socketDefinition.singleInitialItemHash === socket.plugged?.plugDef.hash
  );
}

/** isModSocket and contains something other than its default plug */
export function isUsedModSocket(socket: DimSocket) {
  return (
    isModSocket(socket) &&
    socket.socketDefinition.singleInitialItemHash !== socket.plugged?.plugDef.hash
  );
}
