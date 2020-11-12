export interface ModSocketMetadata {
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

const modSocketMetadata: ModSocketMetadata[] = [
  {
    tag: 'legacy',
    compatibleTags: [
      'warmindcell',
      'chargedwithlight',
      'nightmare',
      'gardenofsalvationraid',
      'legacy',
      'lastwishraid',
    ],
    socketTypeHash: 3873071636,
    plugCategoryHashes: [
      1081029832,
      13646368,
      208760563,
      2712224971,
      426869514,
      443647229,
      65589297,
    ],
    compatiblePlugCategoryHashes: [
      1081029832,
      13646368,
      1486918022,
      208760563,
      2712224971,
      426869514,
      443647229,
      65589297,
    ],
    emptyModSocketHash: 720857,
  },
  {
    tag: 'lastwishraid',
    compatibleTags: ['lastwishraid'],
    socketTypeHash: 1444083081,
    plugCategoryHashes: [13646368],
    compatiblePlugCategoryHashes: [13646368],
    emptyModSocketHash: 1679876242,
  },
  {
    tag: 'legacy',
    compatibleTags: [
      'warmindcell',
      'chargedwithlight',
      'nightmare',
      'gardenofsalvationraid',
      'legacy',
      'lastwishraid',
    ],
    socketTypeHash: 1936582325,
    plugCategoryHashes: [
      1081029832,
      13646368,
      208760563,
      2712224971,
      426869514,
      443647229,
      65589297,
    ],
    compatiblePlugCategoryHashes: [
      1081029832,
      13646368,
      1486918022,
      208760563,
      2712224971,
      426869514,
      443647229,
      65589297,
    ],
    emptyModSocketHash: 2357307006,
  },
  {
    tag: 'combatstyle',
    compatibleTags: ['chargedwithlight', 'warmindcell', 'combatstyle'],
    socketTypeHash: 2955889001,
    plugCategoryHashes: [393461403],
    compatiblePlugCategoryHashes: [208760563, 393461403, 426869514, 443647229, 991069377],
    emptyModSocketHash: 2493100093,
  },
  {
    tag: 'legacy',
    compatibleTags: [
      'warmindcell',
      'chargedwithlight',
      'nightmare',
      'gardenofsalvationraid',
      'legacy',
      'lastwishraid',
    ],
    socketTypeHash: 4127539203,
    plugCategoryHashes: [
      1081029832,
      13646368,
      208760563,
      2712224971,
      426869514,
      443647229,
      65589297,
    ],
    compatiblePlugCategoryHashes: [
      1081029832,
      13646368,
      1486918022,
      208760563,
      2712224971,
      426869514,
      443647229,
      65589297,
    ],
    emptyModSocketHash: 2620967748,
  },
  {
    tag: 'legacy',
    compatibleTags: [
      'warmindcell',
      'chargedwithlight',
      'nightmare',
      'gardenofsalvationraid',
      'legacy',
      'lastwishraid',
    ],
    socketTypeHash: 2836765131,
    plugCategoryHashes: [
      1081029832,
      13646368,
      208760563,
      2712224971,
      426869514,
      443647229,
      65589297,
    ],
    compatiblePlugCategoryHashes: [
      1081029832,
      13646368,
      1486918022,
      208760563,
      2712224971,
      426869514,
      443647229,
      65589297,
    ],
    emptyModSocketHash: 2655746324,
  },
  {
    tag: 'legacy',
    compatibleTags: [
      'warmindcell',
      'chargedwithlight',
      'nightmare',
      'gardenofsalvationraid',
      'legacy',
      'lastwishraid',
    ],
    socketTypeHash: 1540673283,
    plugCategoryHashes: [
      1081029832,
      13646368,
      208760563,
      2712224971,
      426869514,
      443647229,
      65589297,
    ],
    compatiblePlugCategoryHashes: [
      1081029832,
      13646368,
      1486918022,
      208760563,
      2149155760,
      2712224971,
      426869514,
      443647229,
      65589297,
    ],
    emptyModSocketHash: 3625698764,
  },
  {
    tag: 'legacy',
    compatibleTags: [
      'warmindcell',
      'chargedwithlight',
      'nightmare',
      'gardenofsalvationraid',
      'legacy',
      'lastwishraid',
    ],
    socketTypeHash: 1430586844,
    plugCategoryHashes: [
      1081029832,
      13646368,
      208760563,
      2712224971,
      426869514,
      443647229,
      65589297,
    ],
    compatiblePlugCategoryHashes: [
      1081029832,
      13646368,
      1486918022,
      208760563,
      2712224971,
      426869514,
      443647229,
      65589297,
    ],
    emptyModSocketHash: 4106547009,
  },
  {
    tag: 'legacy',
    compatibleTags: [
      'warmindcell',
      'chargedwithlight',
      'nightmare',
      'gardenofsalvationraid',
      'legacy',
      'lastwishraid',
    ],
    socketTypeHash: 3267328333,
    plugCategoryHashes: [
      1081029832,
      13646368,
      208760563,
      2712224971,
      426869514,
      443647229,
      65589297,
    ],
    compatiblePlugCategoryHashes: [
      1081029832,
      13646368,
      1486918022,
      208760563,
      2712224971,
      426869514,
      443647229,
      65589297,
    ],
    emptyModSocketHash: 4153634494,
  },
];

export default modSocketMetadata;
