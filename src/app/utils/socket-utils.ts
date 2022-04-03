import {
  DimItem,
  DimPlug,
  DimSocketCategory,
  PluggableInventoryItemDefinition,
} from 'app/inventory/item-types';
import {
  DestinyInventoryItemDefinition,
  DestinySocketCategoryStyle,
  TierType,
} from 'bungie-api-ts/destiny2';
import { PlugCategoryHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import { DimSocket, DimSockets } from '../inventory/item-types';
import { isArmor2Mod } from './item-utils';

function getSocketHashesByCategoryStyle(
  sockets: DimSockets,
  style: DestinySocketCategoryStyle
): number[] {
  const socketCategory = sockets.categories.find(
    (category) => category.category.categoryStyle === style
  );

  return (socketCategory && getPlugHashesFromCategory(sockets, socketCategory)) || [];
}

function getPlugHashesFromCategory(sockets: DimSockets, category: DimSocketCategory) {
  return getSocketsByIndexes(sockets, category.socketIndexes)
    .map((socket) => socket.plugged?.plugDef.hash ?? NaN)
    .filter((val) => !isNaN(val));
}

export function getSocketsWithStyle(
  sockets: DimSockets,
  style: DestinySocketCategoryStyle
): DimSocket[] {
  const socketHashes = getSocketHashesByCategoryStyle(sockets, style);
  return sockets.allSockets.filter(
    (socket) => socket.plugged && socketHashes.includes(socket.plugged.plugDef.hash)
  );
}

/** Is this socket a weapon's masterwork socket */
export function isWeaponMasterworkSocket(socket: DimSocket) {
  return (
    socket.plugged?.plugDef.plug &&
    (socket.plugged.plugDef.plug.uiPlugLabel === 'masterwork' ||
      socket.plugged.plugDef.plug.plugCategoryIdentifier.includes('masterworks.stat') ||
      socket.plugged.plugDef.plug.plugCategoryIdentifier.endsWith('_masterwork'))
  );
}

/** whether a socket is an armor mod socket. i.e. those grey things. not perks, not reusables, not shaders */
function isArmorModSocket(socket: DimSocket) {
  return socket.plugged && isArmor2Mod(socket.plugged.plugDef);
}

/** isModSocket and contains its default plug */
export function isEmptyArmorModSocket(socket: DimSocket) {
  return isArmorModSocket(socket) && socket.emptyPlugItemHash === socket.plugged?.plugDef.hash;
}

/** isModSocket and contains something other than its default plug */
export function isUsedArmorModSocket(socket: DimSocket) {
  return isArmorModSocket(socket) && socket.emptyPlugItemHash !== socket.plugged?.plugDef.hash;
}

/** Given an item and a list of socketIndexes, find all the sockets that match those indices, in the order the indexes were provided */
export function getSocketsByIndexes(sockets: DimSockets, socketIndexes: number[]) {
  return _.compact(socketIndexes.map((i) => getSocketByIndex(sockets, i)));
}

/** Given a socketIndex, find the socket that matches that index */
export function getSocketByIndex(sockets: DimSockets, socketIndex: number) {
  return sockets.allSockets.find((s) => s.socketIndex === socketIndex);
}

/** Find all sockets on the item that belong to the given category hash */
export function getSocketsByCategoryHash(
  sockets: DimSockets | null,
  categoryHash: SocketCategoryHashes
) {
  const category = sockets?.categories.find((c) => c.category.hash === categoryHash);
  if (!category || !sockets) {
    return [];
  }
  return getSocketsByIndexes(sockets, category.socketIndexes);
}

/** Find all sockets on the item that belong to the given category hash */
export function getSocketsByCategoryHashes(
  sockets: DimSockets | null,
  categoryHashes: SocketCategoryHashes[]
) {
  return categoryHashes.flatMap((categoryHash) => getSocketsByCategoryHash(sockets, categoryHash));
}

/** Special case of getSocketsByCategoryHash that returns the first (presumably only) socket that matches the category hash */
export function getFirstSocketByCategoryHash(
  sockets: DimSockets,
  categoryHash: SocketCategoryHashes
) {
  const category = sockets?.categories.find((c) => c.category.hash === categoryHash);
  if (!category) {
    return undefined;
  }
  const socketIndex = category.socketIndexes[0];
  return sockets.allSockets.find((s) => s.socketIndex === socketIndex);
}

function getSocketsByPlugCategoryIdentifier(sockets: DimSockets, plugCategoryIdentifier: string) {
  return sockets.allSockets.find((socket) =>
    socket.plugged?.plugDef.plug.plugCategoryIdentifier.includes(plugCategoryIdentifier)
  );
}

export function getWeaponArchetypeSocket(item: DimItem): DimSocket | undefined {
  if (item.bucket.inWeapons && item.sockets) {
    return getFirstSocketByCategoryHash(item.sockets, SocketCategoryHashes.IntrinsicTraits);
  }
}

export const getWeaponArchetype = (item: DimItem): PluggableInventoryItemDefinition | undefined =>
  getWeaponArchetypeSocket(item)?.plugged?.plugDef;

export function getArmorExoticPerkSocket(item: DimItem): DimSocket | undefined {
  if (item.bucket.inArmor && item.sockets) {
    const largePerkCategory = item.sockets.categories.find(
      (c) => c.category.hash === SocketCategoryHashes.ArmorPerks_LargePerk
    );
    if (largePerkCategory) {
      const largePerkSocket = getSocketByIndex(
        item.sockets,
        _.nth(largePerkCategory.socketIndexes, -1)!
      );
      if (largePerkSocket?.plugged?.plugDef.displayProperties.name) {
        return largePerkSocket;
      }
    }
    return getSocketsByPlugCategoryIdentifier(item.sockets, 'enhancements.exotic');
  }
}

export function socketContainsPlugWithCategory(
  socket: DimSocket,
  category: PlugCategoryHashes
): socket is Omit<DimSocket, 'plugged'> & { plugged: DimPlug } {
  // the above type predicate removes the need to null-check `plugged` after this call
  return socket.plugged?.plugDef.plug.plugCategoryHash === category;
}

/**
 * the "intrinsic" plug type is:
 * - weapon frames
 * - exotic weapon archetypes
 * - exotic armor special effect plugs
 * - the special invisible plugs that contribute to armor 2.0 stat rolls
 */
export function socketContainsIntrinsicPlug(
  socket: DimSocket
): socket is Omit<DimSocket, 'plugged'> & { plugged: DimPlug } {
  // the above type predicate removes the need to null-check `plugged` after this call
  return socketContainsPlugWithCategory(socket, PlugCategoryHashes.Intrinsics);
}

/**
 * Is this one of the plugs that could possibly fit into this socket? This does not
 * check whether the plug is enabled or unlocked - only that it appears in the list of
 * possible plugs.
 */
export function plugFitsIntoSocket(socket: DimSocket, plugHash: number) {
  return (
    socket.emptyPlugItemHash === plugHash ||
    socket.plugSet?.plugs.some((dimPlug) => dimPlug.plugDef.hash === plugHash) ||
    // TODO(#7793): This should use reusablePlugItems on the socket def
    // because the check should operate on static definitions. This is still
    // incorrect for quite a few blue-quality items because DIM throws away the data.
    socket.reusablePlugItems?.some((p) => p.plugItemHash === plugHash)
  );
}

/**
 * Abilities and supers are "choice sockets", there might be a default
 * but it's not really a meaningful empty or reset option.
 * Still, this can be a useful to initialize user selections.
 */
export function getDefaultAbilityChoiceHash(socket: DimSocket) {
  const { singleInitialItemHash } = socket.socketDefinition;
  return singleInitialItemHash
    ? singleInitialItemHash
    : // Some sockets like Void 3.0 grenades don't have a singleInitialItemHash
      socket.plugSet!.plugs[0]!.plugDef.hash;
}

export function isEnhancedPerk(perk: DimPlug | DestinyInventoryItemDefinition) {
  const plugDef = 'plugDef' in perk ? perk.plugDef : perk;
  return plugDef.inventory!.tierType === TierType.Common;
}
