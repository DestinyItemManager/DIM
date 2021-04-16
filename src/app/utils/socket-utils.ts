import {
  DimItem,
  DimSocketCategory,
  PluggableInventoryItemDefinition,
} from 'app/inventory/item-types';
import { DestinySocketCategoryStyle } from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { DimSocket, DimSockets } from '../inventory/item-types';
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
    .map((socket) => socket.plugged?.plugDef.hash ?? NaN)
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
    socket.plugged?.plugDef.itemCategoryHashes?.includes(categoryHash)
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

export function getSocketsByPlugCategoryIdentifier(
  sockets: DimSockets,
  plugCategoryIdentifier: string
) {
  return sockets.allSockets.find((socket) =>
    socket.plugged?.plugDef.plug.plugCategoryIdentifier.includes(plugCategoryIdentifier)
  );
}

export function getWeaponArchetypeSocket(item: DimItem): DimSocket | undefined {
  if (item.bucket.inWeapons && !item.isExotic) {
    return item.sockets?.categories.find(
      (c) => c.category.hash === SocketCategoryHashes.IntrinsicTraits
    )?.sockets[0];
  }
}

export const getWeaponArchetype = (item: DimItem): PluggableInventoryItemDefinition | undefined =>
  getWeaponArchetypeSocket(item)?.plugged?.plugDef;

export function getArmorExoticPerkSocket(item: DimItem): DimSocket | undefined {
  if (item.isExotic && item.bucket.inArmor && item.sockets) {
    const largePerkCategory = item.sockets.categories.find(
      (c) => c.category.hash === SocketCategoryHashes.ArmorPerks_LargePerk
    );
    if (largePerkCategory) {
      return _.nth(largePerkCategory.sockets, -1);
    }
    return getSocketsByPlugCategoryIdentifier(item.sockets, 'enhancements.exotic');
  }
}

export function isIntrinsicTypeSocket(socket: DimSocket) {
  // return socket.socketDefinition.socketTypeHash===965959289; // SocketTypeHash of exotic perks
  return socket.plugged?.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics;
}
