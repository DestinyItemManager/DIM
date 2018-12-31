export const enum DimWishList {
  WildcardItemId = -69420 // nice
}

/**
 * Interface for translating lists of curated rolls to a format we can use.
 * Initially, support for translating banshee-44.com -> this has been built,
 * but this is here so that we can plug in support for anyone else that can
 * get us this information.
 */
export interface CuratedRoll {
  /** Item hash for the recommended item. */
  itemHash: number;
  /**
   * All of the perks (perk hashes) that need to be present for an item roll to
   * be recognized as curated.
   * Note that we'll discard some (intrinsics, shaders, masterworks) by default.
   * Also note that fuzzy matching isn't present, but can be faked by removing
   * perks that are thought to have marginal bearing on an item.
   */
  recommendedPerks: number[];
  /**
   * Is this an expert mode recommendation?
   * With B-44 rolls, we make sure that most every perk asked for exists
   * on the item. (It does discard masterwork and some other odds and ends).
   * With expert rolls, you can be as vague or specific as you want, so we make
   * sure that at least every perk asked for is there.
   */
  isExpertMode: boolean;
}
