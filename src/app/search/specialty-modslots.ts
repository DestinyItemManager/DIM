import { LookupTable } from 'app/utils/util-types';
import { PlugCategoryHashes } from 'data/d2/generated-enums';

export interface ModSocketMetadata {
  /** we use these two to match with search filters (modslot) */
  slotTag: string;
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

const modSocketMetadata: ModSocketMetadata[] = [
  {
    slotTag: 'lastwish',
    socketTypeHashes: [1444083081],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsSeasonOutlaw],
    emptyModSocketHash: 1679876242, // ARGH, this is the wrong image in the game/manifest
  },
  {
    slotTag: 'gardenofsalvation',
    socketTypeHashes: [1764679361],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidGarden],
    emptyModSocketHash: 706611068,
  },
  {
    slotTag: 'deepstonecrypt',
    socketTypeHashes: [1269555732],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidDescent],
    emptyModSocketHash: 4055462131,
  },
  {
    slotTag: 'vaultofglass',
    socketTypeHashes: [3372624220],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidV520],
    emptyModSocketHash: 3738398030,
  },
  {
    slotTag: 'vowofthedisciple',
    socketTypeHashes: [2381877427],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidV600],
    emptyModSocketHash: 2447143568,
  },
  {
    slotTag: 'kingsfall',
    socketTypeHashes: [3344538838],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidV620],
    emptyModSocketHash: 1728096240,
  },
  {
    slotTag: 'rootofnightmares',
    socketTypeHashes: [1956816524],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidV700],
    emptyModSocketHash: 4144354978,
  },
  {
    slotTag: 'crotasend',
    socketTypeHashes: [2804745000],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidV720],
    emptyModSocketHash: 717667840,
  },
  {
    slotTag: 'salvationsedge',
    socketTypeHashes: [1252302330],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsRaidV800],
    emptyModSocketHash: 4059283783,
  },
  {
    slotTag: 'nightmare',
    socketTypeHashes: [2701840022],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsSeasonMaverick],
    emptyModSocketHash: 1180997867,
  },
  {
    slotTag: 'artifice',
    socketTypeHashes: [1719555937, 2770223926, 3642670483, 2831858578, 4096670123, 3136585661],
    compatiblePlugCategoryHashes: [PlugCategoryHashes.EnhancementsArtifice],
    emptyModSocketHash: 4173924323,
  },
];

export default modSocketMetadata;
