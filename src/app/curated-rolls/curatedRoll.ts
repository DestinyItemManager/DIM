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
}
