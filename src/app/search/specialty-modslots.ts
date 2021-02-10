import { PlugCategoryHashes } from 'data/d2/generated-enums';

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

/** The plug categories that will fit in "legacy" sockets */
export const legacyCompatiblePlugCategoryHashes = [
  PlugCategoryHashes.EnhancementsSeasonMaverick, // nightmare
  PlugCategoryHashes.EnhancementsSeasonOutlaw, // taken/lw
  PlugCategoryHashes.EnhancementsRaidGarden,
  PlugCategoryHashes.EnhancementsSeasonV470, // dawn cwl
  PlugCategoryHashes.EnhancementsSeasonOpulence, // opulent
  PlugCategoryHashes.EnhancementsSeasonV480, // warmind
  PlugCategoryHashes.EnhancementsSeasonV490, // arrivals cwl
  PlugCategoryHashes.EnhancementsSeasonForge, // fallen
];

/** The plug categories that will fit in combat sockets */
export const combatCompatiblePlugCategoryHashes = [
  PlugCategoryHashes.EnhancementsSeasonV470, // dawn cwl
  PlugCategoryHashes.EnhancementsSeasonV500, // elemental well, but technically any "combat" mods
  PlugCategoryHashes.EnhancementsSeasonV480, // warmind cell
  PlugCategoryHashes.EnhancementsSeasonV490, // s11 charged with light
  PlugCategoryHashes.EnhancementsElemental, // 5 deprecated weapon-specific super regen mods
];

// there's a single one-to-many relationship here, but it's most accurate to call it a
export const modTypeTagByPlugCategoryHash = {
  [PlugCategoryHashes.EnhancementsSeasonOutlaw]: 'lastwish',
  [PlugCategoryHashes.EnhancementsSeasonMaverick]: 'nightmare',
  [PlugCategoryHashes.EnhancementsRaidGarden]: 'gardenofsalvation',
  [PlugCategoryHashes.EnhancementsSeasonV470]: 'chargedwithlight',
  [PlugCategoryHashes.EnhancementsSeasonV480]: 'warmindcell',
  [PlugCategoryHashes.EnhancementsSeasonV490]: 'chargedwithlight',
  [PlugCategoryHashes.EnhancementsRaidDescent]: 'deepstonecrypt',
  [PlugCategoryHashes.EnhancementsSeasonV500]: 'combat',
};

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
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsSeasonOutlaw],
    emptyModSocketHashes: [1679876242],
    emptyModSocketHash: 1679876242, // ARGH, this is the wrong image in the game/manifest
  },
  {
    slotTag: 'gardenofsalvation',
    compatibleModTags: ['gardenofsalvation'],
    socketTypeHashes: [1764679361],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidGarden],
    emptyModSocketHashes: [706611068],
    emptyModSocketHash: 706611068,
  },
  {
    slotTag: 'deepstonecrypt',
    compatibleModTags: ['deepstonecrypt'],
    socketTypeHashes: [1269555732],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidDescent],
    emptyModSocketHashes: [4055462131],
    emptyModSocketHash: 4055462131,
  },
  {
    slotTag: 'combatstyle',
    compatibleModTags: ['chargedwithlight', 'warmindcell', 'elementalwell'],
    socketTypeHashes: [2955889001],
    compatiblePlugCategoryHashes: combatCompatiblePlugCategoryHashes,
    emptyModSocketHashes: [2493100093],
    emptyModSocketHash: 2493100093,
  },
];

export default modSocketMetadata;
