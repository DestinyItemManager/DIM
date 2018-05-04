import {
  DestinyStat,
  DestinyStatDefinition,
  DestinyInventoryItemDefinition,
  DestinySandboxPerkDefinition,
  DestinyObjectiveProgress,
  DestinySocketCategoryDefinition,
  DestinyClass,
  DestinyItemTierTypeInfusionBlock,
  DestinyItemQualityBlockDefinition
} from 'bungie-api-ts/destiny2';
import { DimItemInfo } from './dim-item-info';
import { DimStore } from './store-types';
import { InventoryBucket } from './inventory-buckets';
import { D2CachedItem } from '../item-review/d2-dtr-api-types';
import { D1CachedItem } from '../item-review/d1-dtr-api-types';

// TODO: maybe break these out into separate files for D1/D2?

/**
 * A generic DIM item, representing almost anything. Use this type when you can handle both D1 and D2 items,
 * or you don't use anything specific to one of them.
 */
// TODO: This interface is clearly too large - break out interfaces for common subsets
export interface DimItem {
  owner: string;
  /** The version of Destiny this comes from */
  destinyVersion: 1 | 2;
  /** The bucket the item is currently in */
  location: InventoryBucket;
  /** The bucket the item normally resides in (even though it may be in the vault/postmaster) */
  bucket: InventoryBucket;
  hash: number;
  /** This is the type of the item (see DimCategory/DimBuckets) regardless of location */
  type: string;
  categories: string[];
  tier: string;
  isExotic: boolean;
  isVendorItem: boolean;
  name: string;
  description: string;
  icon: string;
  secondaryIcon: string;
  notransfer: boolean;
  canPullFromPostmaster: boolean;
  id: string; // zero for non-instanced is legacy hack
  equipped: boolean;
  equipment: boolean;
  /**
   * If defined, this is the label used to check if the character has other items of
   * matching types already equipped.
   *
   * For instance, when you aren't allowed to equip more than one Exotic Weapon, that's
   * because all exotic weapons have identical labels and the game checks the
   * to-be-equipped item's label vs. all other already equipped items (other
   * than the item in the slot that's about to be occupied).
   */
  equippingLabel?: string;
  complete: boolean;
  amount: number;
  primStat: DestinyStat | null;
  /** Localized name of this item's type. */
  typeName: string;
  equipRequiredLevel: number;
  maxStackSize: number;
  classType: DestinyClass;
  classTypeName: string;
  classTypeNameLocalized: string;
  dmg: string;
  visible: boolean;
  lockable: boolean;
  tracked: boolean;
  locked: boolean;
  masterwork: boolean;
  classified: boolean;
  isInLoadout: boolean;
  percentComplete: number;
  hidePercentage: boolean;
  taggable: boolean;
  comparable: boolean;
  reviewable: boolean;
  isNew: boolean;
  dimInfo: DimItemInfo;
  basePower: number;
  index: string;
  infusable: boolean;
  infusionFuel: boolean;
  talentGrid: DimTalentGrid | null;
  perks: DimPerk[] | null;
  stats: DimStat[] | null;
  objectives: DimObjective[] | null;
  isEngram: boolean;
  /** A timestamp of when, in this session, the item was last manually moved */
  lastManuallyMoved: number;

  // // TODO: this should be on a separate object, with the other DTR stuff
  // pros: string;
  // cons: string;
  // userRating: number;
  // userReview: string;
  // userVote: number;
  // dtrRating: number;
  // dtrRatingCount: number;
  // dtrHighlightedRatingCount: number;
  // reviews: DtrUserReview[] | D1ItemUserReview[];
  // userReviewPros: string;
  // userReviewCons: string;
  // mode: number;
  // ratingCount: number;
  // // timestamp of when reviews were attached - a hack to help React update in the short term
  // reviewsUpdated?: number;
  // /** Is the review data locally cached? */
  // isLocallyCached?: boolean;
  // totalReviews: number;

  /** Can this item be equipped by the given store? */
  canBeEquippedBy(store: DimStore): boolean;
  inCategory(categoryName: string): boolean;
  canBeInLoadout(): boolean;
  updateManualMoveTimestamp(): void;

  /**
   * Check if this item is from D1. Inside an if statement, this item will be narrowed to type D1Item.
   */
  isDestiny1(): this is D1Item;
  /**
   * Check if this item is from D2. Inside an if statement, this item will be narrowed to type D2Item.
   */
  isDestiny2(): this is D2Item;
}

/**
 * A Destiny 1 item. Use this type when you need specific D1 properties.
 */
export interface D1Item extends DimItem {
  primStat: D1PrimStat | null;
  talentGrid: D1TalentGrid | null;
  sort?: string;
  stats: D1Stat[] | null;
  quality: {
    min: number;
    max: number;
  } | null;
  year: number;
  sourceHashes: number[];
  trackable: boolean;

  ratingData?: D1CachedItem;
}

/**
 * A Destiny 2 item. Use this type when you need specific D2 properties.
 */
export interface D2Item extends DimItem {
  location: InventoryBucket;
  bucket: InventoryBucket;
  primStat: D2PrimStat | null;
  sockets: DimSockets | null;
  flavorObjective: DimFlavorObjective | null;
  masterworkInfo: DimMasterwork | null;
  infusionQuality: DestinyItemQualityBlockDefinition | null;
  infusionProcess: DestinyItemTierTypeInfusionBlock | null;
  ratingData: D2CachedItem | null;
}

export interface D2PrimStat extends DestinyStat {
  stat: DestinyStatDefinition & { statName: string };
}
export interface D1PrimStat extends DestinyStat {
  stat: any;
}

export interface DimMasterwork {
  progress?: number;
  typeName: 'Vanguard' | 'Crucible' | null;
  typeIcon: string;
  typeDesc: string | null;
  statHash?: number;
  statName: string;
  statValue?: number;
}

export interface DimStat {
  base: number;
  bonus: number;
  statHash: number;
  name: string;
  id: number;
  sort: number;
  value?: number;
  maximumValue: number;
  bar: boolean;
  /** Is this a placeholder for a "missing" stat (for compare view) */
  missingStat?: boolean;
}

export interface D1Stat extends DimStat {
  scaled?: {
    max: number;
    min: number;
  };
  split?: number;
  qualityPercentage?: {
    max: number;
    min: number;
    range: string;
  };
}

export interface DimObjective {
  displayName: string;
  description?: string;
  progress: number;
  completionValue: number;
  complete: boolean;
  boolean: boolean;
  display?: string;
  displayStyle: string | null;
}

export interface DimFlavorObjective {
  description: string;
  icon: string;
  progress: number;
}

export interface DimTalentGrid {
  nodes: DimGridNode[];
  complete: boolean;
}

export interface D1TalentGrid extends DimTalentGrid {
  nodes: D1GridNode[];
  xpComplete: boolean;
  totalXPRequired: number;
  totalXP: number;
  hasAscendNode: boolean;
  ascended: boolean;
  infusable: boolean;
  dtrPerks: string;
  dtrRoll: string;
}

export interface DimGridNode {
  name: string;
  hash: number;
  description: string;
  icon: string;
  /** Position in the grid */
  column: number;
  row: number;
  /** Is the node selected (lit up in the grid) */
  activated: boolean;
  /** The item level at which this node can be unlocked */
  activatedAtGridLevel: number;
  /** Only one node in this column can be selected (scopes, etc) */
  exclusiveInColumn: boolean;
  /** Whether or not the material cost has been paid for the node */
  unlocked: boolean;
  /** Some nodes don't show up in the grid, like purchased ascend nodes */
  hidden: boolean;
}

export interface D1GridNode extends DimGridNode {
  ornament: boolean;
  xp: number;
  xpRequired: number;
  xpRequirementMet: boolean;

  dtrHash: string | null;
  dtrRoll: string;

  bestRated?: boolean; // used for D1 perk ratings
}

/**
 * Dim's view of a "Plug" - an item that can go into a socket.
 * In D2, both perk grids and mods/shaders are sockets with plugs.
 */
export interface DimPlug {
  plugItem: DestinyInventoryItemDefinition;
  bestRated?: boolean;
  perks: DestinySandboxPerkDefinition[];
  plugObjectives: DestinyObjectiveProgress[];
  enabled: boolean;
  /** If not enabled, this is the localized reasons why, as a single string. */
  enableFailReasons: string;
  isMasterwork: boolean;
}

export interface DimSocket {
  socketIndex: number;
  /** The currently inserted plug item, if any. */
  plug: DimPlug | null;
  /** Potential plugs for this socket. */
  plugOptions: DimPlug[];
}

export interface DimSocketCategory {
  category: DestinySocketCategoryDefinition;
  sockets: DimSocket[];
}

export interface DimSockets {
  sockets: DimSocket[];
  categories: DimSocketCategory[];
}

export interface DimPerk extends DestinySandboxPerkDefinition {
  requirement: string;
}
