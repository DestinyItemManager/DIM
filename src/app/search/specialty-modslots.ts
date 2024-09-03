import { LookupTable } from 'app/utils/util-types';
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
  /** this helps us look up an "empty socket" definition, for its icon & name only */
  emptyModSocketHash: number;
  /**
   * the year is 2022. the raid is Vow of the Disciple. bungie forgot to give raid mods a itemTypeDisplayName.
   * let's use this Activity name instead.
   * NB this was fixed but may prove useful in the future if it happens again, so let's keep this around?
   */
  modGroupNameOverrideActivityHash?: number;
}

const legacyCompatibleTags = ['nightmare', 'gardenofsalvation', 'lastwish'];

/** The plug categories that will fit in "legacy" sockets */
const legacyCompatiblePlugCategoryHashes = [
  PlugCategoryHashes.EnhancementsSeasonMaverick, // nightmare
  PlugCategoryHashes.EnhancementsSeasonOutlaw, // taken/lw
  PlugCategoryHashes.EnhancementsRaidGarden,
  PlugCategoryHashes.EnhancementsSeasonOpulence, // opulent
  PlugCategoryHashes.EnhancementsSeasonForge, // fallen
];

export const modTypeTagByPlugCategoryHash: LookupTable<PlugCategoryHashes, string> = {
  [PlugCategoryHashes.EnhancementsSeasonOutlaw]: 'lastwish',
  [PlugCategoryHashes.EnhancementsSeasonMaverick]: 'nightmare',
  [PlugCategoryHashes.EnhancementsRaidGarden]: 'gardenofsalvation',
  [PlugCategoryHashes.EnhancementsRaidDescent]: 'deepstonecrypt',
  [PlugCategoryHashes.EnhancementsRaidV520]: 'vaultofglass',
  [PlugCategoryHashes.EnhancementsRaidV600]: 'vowofthedisciple',
  [PlugCategoryHashes.EnhancementsRaidV620]: 'kingsfall',
  [PlugCategoryHashes.EnhancementsArtifice]: 'artifice',
  [PlugCategoryHashes.EnhancementsRaidV700]: 'rootofnightmares',
  [PlugCategoryHashes.EnhancementsRaidV720]: 'crotasend',
  [PlugCategoryHashes.EnhancementsRaidV800]: 'salvationsedge',
};

// FIXME(Lightfall) what about legacy?

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
    emptyModSocketHash: 4153634494, // the arrivals icon. i don't know.
  },
  {
    slotTag: 'lastwish',
    compatibleModTags: ['lastwish'],
    socketTypeHashes: [1444083081],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsSeasonOutlaw],
    emptyModSocketHash: 1679876242, // ARGH, this is the wrong image in the game/manifest
  },
  {
    slotTag: 'gardenofsalvation',
    compatibleModTags: ['gardenofsalvation'],
    socketTypeHashes: [1764679361],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidGarden],
    emptyModSocketHash: 706611068,
  },
  {
    slotTag: 'deepstonecrypt',
    compatibleModTags: ['deepstonecrypt'],
    socketTypeHashes: [1269555732],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidDescent],
    emptyModSocketHash: 4055462131,
  },
  {
    slotTag: 'vaultofglass',
    compatibleModTags: ['vaultofglass'],
    socketTypeHashes: [3372624220],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidV520],
    emptyModSocketHash: 3738398030,
  },
  {
    slotTag: 'vowofthedisciple',
    compatibleModTags: ['vowofthedisciple'],
    socketTypeHashes: [2381877427],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidV600],
    emptyModSocketHash: 2447143568,
  },
  {
    slotTag: 'kingsfall',
    compatibleModTags: ['kingsfall'],
    socketTypeHashes: [3344538838],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidV620],
    emptyModSocketHash: 1728096240,
  },
  {
    slotTag: 'rootofnightmares',
    compatibleModTags: ['rootofnightmares'],
    socketTypeHashes: [1956816524],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidV700],
    emptyModSocketHash: 4144354978,
  },
  {
    slotTag: 'crotasend',
    compatibleModTags: ['crotasend'],
    socketTypeHashes: [2804745000],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidV720],
    emptyModSocketHash: 717667840,
  },
  {
    slotTag: 'salvationsedge',
    compatibleModTags: ['salvationsedge'],
    socketTypeHashes: [1252302330],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidV800],
    emptyModSocketHash: 4059283783,
  },
  {
    slotTag: 'nightmare',
    compatibleModTags: ['nightmare'],
    socketTypeHashes: [2701840022],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsSeasonMaverick],
    emptyModSocketHash: 1180997867,
  },
  {
    slotTag: 'artifice',
    compatibleModTags: ['artifice'],
    socketTypeHashes: [1719555937, 2770223926, 3642670483, 2831858578, 4096670123, 3136585661],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsArtifice],
    emptyModSocketHash: 4173924323,
  },
];

export default modSocketMetadata;
