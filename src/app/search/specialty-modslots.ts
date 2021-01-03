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

export const legacyCompatiblePlugCategoryHashes = [
  1081029832, // nightmare
  13646368, // taken/lw
  1486918022, // garden
  208760563, // dawn cwl
  2712224971, // opulent
  426869514, // warmind
  443647229, // arrivals cwl
  65589297, // fallen/forge
];

/** The plugs that will fit in combat sockets */
export const combatCompatiblePlugCategoryHashes = [
  208760563,
  393461403,
  426869514,
  443647229,
  991069377,
];

const legacySocketTypeHashes = [
  1540673283, // an outlaw-looking one, that's on S11 LW/Reverie,
  // but in-game it has the same compatibility as any other legacy slot
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
    slotTag: 'deepstonecrypt',
    compatibleModTags: ['deepstonecrypt'],
    socketTypeHashes: [1269555732],
    compatiblePlugCategoryHashes: [1486918022],
    emptyModSocketHashes: [4055462131],
    emptyModSocketHash: 4055462131,
  },
  {
    slotTag: 'combatstyle',
    compatibleModTags: ['chargedwithlight', 'warmindcell'],
    socketTypeHashes: [2955889001],
    compatiblePlugCategoryHashes: combatCompatiblePlugCategoryHashes,
    emptyModSocketHashes: [2493100093],
    emptyModSocketHash: 2493100093,
  },
];

export default modSocketMetadata;

export const modTypeTagByPlugCategoryHash = {
  13646368: 'lastwish',
  1081029832: 'nightmare',
  1486918022: 'gardenofsalvation',
  208760563: 'chargedwithlight',
  426869514: 'warmindcell',
  443647229: 'chargedwithlight',
  1703496685: 'deepstonecrypt',
};
