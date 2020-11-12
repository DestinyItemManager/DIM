export interface ModSocketMetadata {
  /** we use these two to match with search filters (modslot) */
  slotTag: string;
  /** mod tags are a 1-to-some correlation with plugCategoryHashes */
  compatibleModTags: string[];
  /** armor items have sockets, and sockets have a socketTypeHash */
  socketTypeHashes: number[];
  /** mod items have a plugCategoryHash. this mod slot can hold these plugCategoryHashes */
  compatiblePlugCategoryHashes: number[];
  /** this helps us look up the "empty socket" definition, for its icon & name */
  emptyModSocketHash: number;
  /** so you can look these entries up if all you're given is an "Empty Mod Slot" plug item */
  emptyModSocketHashes: number[];
}

const legacyCompatibleTags = [
  'warmindcell',
  'chargedwithlight',
  'nightmare',
  'gardenofsalvation',
  'lastwish',
];

const legacyCompatiblePlugCategoryHashes = [
  1081029832, // nightmare
  13646368, // taken/lw
  1486918022, // garden
  208760563, // dawn cwl
  2712224971, // opulent
  426869514, // warmind
  443647229, // arrivals cwl
  65589297, // fallen/forge
];

const legacySocketTypeHashes = [
  3873071636, // forge
  1936582325, // dawn
  4127539203, // undying
  2836765131, // worthy
  1430586844, // opulent
  3267328333, // arrivals
];

const legacyEmptyModSocketHashes = [
  720857, // forge
  2357307006, // dawn
  2620967748, // undying
  2655746324, // worthy
  4153634494, // arrivals
  4106547009, // opulent
];

const modSocketMetadata: ModSocketMetadata[] = [
  {
    slotTag: 'legacy',
    compatibleModTags: legacyCompatibleTags,
    socketTypeHashes: legacySocketTypeHashes,
    compatiblePlugCategoryHashes: legacyCompatiblePlugCategoryHashes,
    emptyModSocketHash: 4153634494, // the arrivals icon. i don't know.
    emptyModSocketHashes: legacyEmptyModSocketHashes,
  },
  {
    slotTag: 'lastwish',
    compatibleModTags: ['lastwish'],
    socketTypeHashes: [1444083081],
    compatiblePlugCategoryHashes: [13646368],
    emptyModSocketHashes: [1679876242],
    emptyModSocketHash: 1679876242, // ARGH, this is the wrong image in the game/manifest
  },
  {
    slotTag: 'gardenofsalvation',
    compatibleModTags: ['gardenofsalvation'],
    socketTypeHashes: [1764679361],
    compatiblePlugCategoryHashes: [1486918022],
    emptyModSocketHashes: [706611068],
    emptyModSocketHash: 706611068,
  },
  {
    slotTag: 'combatstyle',
    compatibleModTags: ['chargedwithlight', 'warmindcell'],
    socketTypeHashes: [2955889001],
    compatiblePlugCategoryHashes: [208760563, 393461403, 426869514, 443647229, 991069377],
    emptyModSocketHashes: [2493100093],
    emptyModSocketHash: 2493100093,
  },
  {
    slotTag: 'reveriedawn',
    compatibleModTags: legacyCompatibleTags,
    socketTypeHashes: [1540673283],
    compatiblePlugCategoryHashes: [
      ...legacyCompatiblePlugCategoryHashes,
      2149155760, // riven's curse/transcendant blessing
    ],
    emptyModSocketHashes: [3625698764],
    emptyModSocketHash: 3625698764,
  },
];

export default modSocketMetadata;
