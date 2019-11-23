import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import { DimSocketCategory } from 'app/inventory/item-types';
import { DimSockets, DimSocket } from '../inventory/item-types';

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
    .map((socket) => socket?.plug?.plugItem?.hash ?? NaN)
    .filter((val) => !isNaN(val));
}

export function getSocketsWithStyle(
  sockets: DimSockets,
  style: DestinySocketCategoryStyle
): DimSocket[] {
  const masterworkSocketHashes = getMasterworkSocketHashes(sockets, style);
  return sockets.sockets.filter(
    (socket) => socket.plug && masterworkSocketHashes.includes(socket.plug.plugItem.hash)
  );
}

export function getSocketsWithPlugCategoryHash(sockets: DimSockets, categoryHash: number) {
  return sockets.sockets.filter((socket) => {
    const categoryHashes = socket?.plug?.plugItem?.itemCategoryHashes ?? [];
    return categoryHashes.includes(categoryHash);
  });
}
