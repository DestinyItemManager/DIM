import { normalizeToEnhanced, normalizeToUnenhanced } from 'app/utils/perk-utils';
import { BucketHashes, ItemCategoryHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import { DimItem, DimPlug } from '../inventory/item-types';
import { DimWishList, WishListRoll } from './types';

const targetPCHs = [
  PlugCategoryHashes.Frames,
  PlugCategoryHashes.Bowstrings,
  PlugCategoryHashes.Batteries,
  PlugCategoryHashes.Blades,
  PlugCategoryHashes.Tubes,
  PlugCategoryHashes.Scopes,
  PlugCategoryHashes.Hafts,
  PlugCategoryHashes.Stocks,
  PlugCategoryHashes.Guards,
  PlugCategoryHashes.Barrels,
  PlugCategoryHashes.Arrows,
  PlugCategoryHashes.Grips,
  PlugCategoryHashes.Scopes,
  PlugCategoryHashes.Magazines,
  PlugCategoryHashes.MagazinesGl,
  PlugCategoryHashes.Rails,
  PlugCategoryHashes.Bolts,
  PlugCategoryHashes.Origins,
];

export const enum UiWishListRoll {
  Good = 1,
  Bad,
}

export function toUiWishListRoll(
  inventoryWishListRoll?: InventoryWishListRoll,
): UiWishListRoll | undefined {
  if (!inventoryWishListRoll) {
    return undefined;
  }
  return inventoryWishListRoll.isUndesirable ? UiWishListRoll.Bad : UiWishListRoll.Good;
}

/**
 * An inventory wish list roll - for an item instance ID, is the item known to be on the wish list?
 * If it is on the wish list, what perks are responsible for it being there?
 */
export interface InventoryWishListRoll {
  /** What perks did the curator pick for the item? */
  wishListPerks: Set<number>;
  /** What notes (if any) did the curator make for this item + roll? */
  notes: string | undefined;
  /** Is this an undesirable roll? */
  isUndesirable?: boolean;
}

/**
 * Is this a weapon or armor plug that we'll consider?
 * This is in place so that we can disregard intrinsics, shaders/cosmetics
 * and other things (like masterworks) which add more variance than we need.
 */
function isWeaponOrArmorOrGhostMod(plug: DimPlug): boolean {
  if (targetPCHs.includes(plug.plugDef.plug.plugCategoryHash)) {
    return true;
  }

  if (
    plug.plugDef.itemCategoryHashes?.find(
      (ich) =>
        ich === ItemCategoryHashes.WeaponModsIntrinsic ||
        ich === ItemCategoryHashes.WeaponModsGameplay ||
        ich === ItemCategoryHashes.ArmorModsGameplay,
    )
  ) {
    return false;
  }

  // if it's an instanced modification, ignore it
  if (
    plug.plugDef.inventory!.bucketTypeHash === BucketHashes.Modifications &&
    plug.plugDef.inventory!.isInstanceItem
  ) {
    return false;
  }

  return (
    plug.plugDef.itemCategoryHashes?.some(
      (ich) =>
        ich === ItemCategoryHashes.WeaponMods ||
        ich === ItemCategoryHashes.ArmorMods ||
        ich === ItemCategoryHashes.BonusMods ||
        ich === ItemCategoryHashes.GhostModsPerks,
    ) ?? false
  ); // weapon, then armor, then bonus (found on armor perks), then ghost mod
}

/** Is the plug's hash included in the recommended perks from the wish list roll? */
export function isWishListPlug(
  plug: DimPlug,
  wishListRoll?: WishListRoll | InventoryWishListRoll,
): boolean {
  const perks =
    wishListRoll &&
    ('recommendedPerks' in wishListRoll
      ? wishListRoll.recommendedPerks
      : wishListRoll.wishListPerks);
  return Boolean(
    perks &&
    // Either the enhanced or unenhanced version of the perk is present
    (perks.has(normalizeToUnenhanced(plug.plugDef.hash)) ||
      perks.has(normalizeToEnhanced(plug.plugDef.hash))),
  );
}

/** Get all of the plugs for this item that match the wish list roll. */
function getWishListPlugs(item: DimItem, wishListRoll: WishListRoll): Set<number> {
  const wishListPlugs = new Set<number>();
  if (!item.sockets) {
    return wishListPlugs;
  }

  for (const s of item.sockets.allSockets) {
    if (s.plugged) {
      for (const dp of s.plugOptions) {
        if (isWeaponOrArmorOrGhostMod(dp) && isWishListPlug(dp, wishListRoll)) {
          wishListPlugs.add(dp.plugDef.hash);
        }
      }
    }
  }

  return wishListPlugs;
}

/**
 * Do all desired perks from the wish list roll exist on this item?
 * Disregards cosmetics and some other socket types.
 */
function allDesiredPerksExist(item: DimItem, wishListRoll: WishListRoll): boolean {
  if (wishListRoll.isExpertMode) {
    for (const recommendedPerk of wishListRoll.recommendedPerks) {
      let included = false;

      // this function serves only getInventoryWishListRoll,
      // which has already ensured item.sockets exists
      outer: for (const s of item.sockets!.allSockets) {
        if (s.plugOptions) {
          for (const plug of s.plugOptions) {
            if (
              // Either the enhanced or unenhanced version of the perk is present
              normalizeToUnenhanced(plug.plugDef.hash) === recommendedPerk ||
              normalizeToEnhanced(plug.plugDef.hash) === recommendedPerk
            ) {
              included = true;
              break outer;
            }
          }
        }
      }

      if (!included) {
        return false;
      }
    }
    return true;
  }

  return item.sockets!.allSockets.every(
    (s) =>
      !s.plugged ||
      !isWeaponOrArmorOrGhostMod(s.plugged) ||
      s.plugOptions.some((dp) => isWishListPlug(dp, wishListRoll)),
  );
}

/** Get the InventoryWishListRoll for this item. */
export function getInventoryWishListRoll(
  item: DimItem,
  wishListRolls: Map<number, WishListRoll[]>,
): InventoryWishListRoll | undefined {
  // It could be under the item hash, the wildcard, or any of the item's categories
  for (const hash of [item.hash, DimWishList.WildcardItemId, ...item.itemCategoryHashes]) {
    const matchingWishListRoll = wishListRolls
      .get(hash)
      ?.find((cr) => allDesiredPerksExist(item, cr));
    if (matchingWishListRoll) {
      return {
        wishListPerks: getWishListPlugs(item, matchingWishListRoll),
        notes: matchingWishListRoll.notes,
        isUndesirable: matchingWishListRoll.isUndesirable,
      };
    }
  }
}
