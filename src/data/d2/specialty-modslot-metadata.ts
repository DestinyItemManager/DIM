export interface ModSocketMetadata {
  /** this allows us to sort mods chronologically for LO purposes */
  season: number;
  /** we use these two to match with search filters */
  tag: string;
  compatibleTags: string[];
  /** an item's socket's socketTypeHash is used to look up ModSocketMetadata */
  socketTypeHash: number;
  /**
   * mods don't inherently point back to their compatible slot,
   * they just have a plugCategoryHash.
   * a socket points to a socketType which refers to multiple plugCategoryHashes
   * so here is a more direct way, if you have a plugCategoryHash,
   * to find ModSocketMetadata without doing definition lookups and finds
   */
  plugCategoryHashes: number[];
  /**
   * hashes are used for faster lookups in loadout organizer,
   * they correspond directly to info found inside individual mod
   */
  compatiblePlugCategoryHashes: number[];
  /** this helps us look up the "empty socket" definition, for its icon/name */
  emptyModSocketHash: number;
}

const modSocketMetadata: ModSocketMetadata[] = [];

export default modSocketMetadata;
