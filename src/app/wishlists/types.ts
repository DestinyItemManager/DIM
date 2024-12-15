export const enum DimWishList {
  WildcardItemId = -69420, // nice
}

/**
 * Interface for translating lists of wish list rolls to a format we can use.
 * Initially, support for translating banshee-44.com -> this has been built,
 * but this is here so that we can plug in support for anyone else that can
 * get us this information.
 */
export interface WishListRoll {
  /** Item hash for the recommended item, OR an item category hash, OR the special WildcardItemId. */
  itemHash: number;
  /**
   * All of the perks (perk hashes) that need to be present for an item roll to
   * be recognized as a wish list roll.
   * Note that we'll discard some (intrinsics, shaders, masterworks) by default.
   * Also note that fuzzy matching isn't present, but can be faked by removing
   * perks that are thought to have marginal bearing on an item.
   */
  recommendedPerks: Set<number>;
  /**
   * Is this an expert mode recommendation?
   * With B-44 rolls, we make sure that most every perk asked for exists
   * on the item. (It does discard masterwork and some other odds and ends).
   * With expert rolls, you can be as vague or specific as you want, so we make
   * sure that at least every perk asked for is there.
   */
  isExpertMode: boolean;

  /**
   * Is this an undesirable item/roll?
   * By default, we expect things in the wish list to be desired rolls, but
   * it's possible that you might have some items/rolls that you want no part of.
   * We'll mark undesirable items with a thumbs down instead.
   */
  isUndesirable?: boolean;

  /** Optional notes from the curator. */
  notes?: string;
}

export interface WishListAndInfo {
  wishListRolls: WishListRoll[];
  /** The URL(s) we fetched the wish list(s) from */
  source?: string;
  infos: WishListInfo[];
}

export interface WishListInfo {
  /** The wish list URL. If undefined, this is a local wish list. */
  url: string | undefined;
  title?: string;
  description?: string;
  /** The number of rolls from this wish list that actually made it in (e.g. were valid and unique). */
  numRolls: number;
  /** The number of rolls in this list that were duplicates of other lists. */
  dupeRolls: number;
}
