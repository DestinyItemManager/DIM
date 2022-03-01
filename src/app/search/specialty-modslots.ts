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

// EnhancementsSeasonV500 has a one-to-many relationship here,
// but it's most accurate to call the category "combat" not "elemental well"
export const modTypeTagByPlugCategoryHash = {
  [PlugCategoryHashes.EnhancementsSeasonOutlaw]: 'lastwish',
  [PlugCategoryHashes.EnhancementsSeasonMaverick]: 'nightmare',
  [PlugCategoryHashes.EnhancementsRaidGarden]: 'gardenofsalvation',
  [PlugCategoryHashes.EnhancementsSeasonV470]: 'chargedwithlight',
  [PlugCategoryHashes.EnhancementsSeasonV480]: 'warmindcell',
  [PlugCategoryHashes.EnhancementsSeasonV490]: 'chargedwithlight',
  [PlugCategoryHashes.EnhancementsRaidDescent]: 'deepstonecrypt',
  [PlugCategoryHashes.EnhancementsRaidV520]: 'vaultofglass',
  [PlugCategoryHashes.EnhancementsSeasonV500]: 'combat',
};

export const chargedWithLightPlugCategoryHashes = [
  PlugCategoryHashes.EnhancementsSeasonV470,
  PlugCategoryHashes.EnhancementsSeasonV490,
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

const modSocketMetadata: ModSocketMetadata[] = [
  {
    slotTag: 'legacy',
    compatibleModTags: legacyCompatibleTags,
    socketTypeHashes: legacySocketTypeHashes,
    compatiblePlugCategoryHashes: legacyCompatiblePlugCategoryHashes,
  },
  {
    slotTag: 'lastwish',
    compatibleModTags: ['lastwish'],
    socketTypeHashes: [1444083081],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsSeasonOutlaw],
  },
  {
    slotTag: 'gardenofsalvation',
    compatibleModTags: ['gardenofsalvation'],
    socketTypeHashes: [1764679361],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidGarden],
  },
  {
    slotTag: 'deepstonecrypt',
    compatibleModTags: ['deepstonecrypt'],
    socketTypeHashes: [1269555732],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidDescent],
  },
  {
    slotTag: 'vaultofglass',
    compatibleModTags: ['vaultofglass'],
    socketTypeHashes: [3372624220],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidV520],
  },
  {
    slotTag: 'combatstyle',
    compatibleModTags: ['chargedwithlight', 'warmindcell', 'combat'],
    socketTypeHashes: [2955889001],
    compatiblePlugCategoryHashes: combatCompatiblePlugCategoryHashes,
  },
  {
    slotTag: 'nightmare',
    compatibleModTags: ['nightmare'],
    socketTypeHashes: [2701840022],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsSeasonMaverick],
  },
];

export default modSocketMetadata;
