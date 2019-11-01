import {
  DestinyStat,
  DestinyStatDefinition,
  DestinyInventoryItemDefinition,
  DestinySandboxPerkDefinition,
  DestinyObjectiveProgress,
  DestinySocketCategoryDefinition,
  DestinyClass,
  DestinyCollectibleState,
  DestinyItemTierTypeInfusionBlock,
  DestinyItemQualityBlockDefinition,
  DestinyAmmunitionType,
  DestinyItemQuantity,
  DestinyDisplayPropertiesDefinition,
  DestinyItemInstanceEnergy,
  DestinyItemSocketEntryDefinition
} from 'bungie-api-ts/destiny2';
import { DimItemInfo } from './dim-item-info';
import { DimStore, StoreServiceType, D1StoreServiceType, D2StoreServiceType } from './store-types';
import { InventoryBucket } from './inventory-buckets';
import { D2EventEnum } from 'data/d2/d2-event-info';

/**
 * A generic DIM item, representing almost anything. Use this type when you can handle both D1 and D2 items,
 * or you don't use anything specific to one of them.
 */
// TODO: This interface is clearly too large - break out interfaces for common subsets
export interface DimItem {
  /** The ID of the store that currently contains this item. */
  owner: string;
  /** The version of Destiny this comes from. */
  destinyVersion: 1 | 2;
  /** The bucket the item is currently in. */
  location: InventoryBucket;
  /** The bucket the item normally resides in (even though it may currently be elsewhere, such as in the postmaster). */
  bucket: InventoryBucket;
  /** The inventoryItemHash, see DestinyInventoryItemDefinition. */
  hash: number;
  /** This is the type of the item (see InventoryBuckets) regardless of location. This string is a DIM concept with no direct correlation to the API types. */
  type: string;
  /** Hashes of DestinyItemCategoryDefinitions this item belongs to */
  itemCategoryHashes: number[];
  /** A readable English name for the rarity of the item (e.g. "Exotic", "Rare"). */
  tier: string;
  /** Is this an Exotic item? */
  isExotic: boolean;
  /** Did this come from a vendor instead of character inventory? */
  isVendorItem: boolean;
  /** Localized name of the item. */
  name: string;
  /** Localized description of the item. */
  description: string;
  /** Icon path for the item. */
  icon: string;
  /** Some items have a secondary icon, namely Emblems. */
  secondaryIcon: string;
  /** Whether this item CANNOT be transferred. */
  notransfer: boolean;
  /** Whether we can pull this item from the postmaster */
  canPullFromPostmaster: boolean;
  /** Item instance id. Non-instanced items have id "0" for D1 compatibility. */
  id: string;
  /** Is this item currently equipped? */
  equipped: boolean;
  /** Is this "equipment" (items that can be equipped). */
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
  /** Is this item complete (leveled, unlocked, objectives complete). */
  complete: boolean;
  /** How many items does this represent? Only greater than one if maxStackSize is greater than one. */
  amount: number;
  /** The primary stat (Attack, Defense, Speed) of the item. */
  primStat:
    | DestinyStat & {
        stat: DestinyStatDefinition;
      }
    | null;
  /** Localized name of this item's type. */
  typeName: string;
  /** The level a character must be to equip this item. */
  equipRequiredLevel: number;
  /** The maximum number of items that stack together for this item type. */
  maxStackSize: number;
  /** Is this stack unique (one per account, sometimes two if you can move to vault)? */
  uniqueStack: boolean;
  /** The class this item is restricted to. Unknown means it can be used by any class. */
  classType: DestinyClass;
  /** The localized name of the class this item is restricted to. */
  classTypeNameLocalized: string;
  /** The readable name of the damage type associated with this item. */
  dmg: 'kinetic' | 'arc' | 'solar' | 'void' | 'heroic' | null;
  /** Whether this item can be locked. */
  lockable: boolean;
  /** Is this item tracked? (D1 quests/bounties). */
  tracked: boolean;
  /**
   * Is this item locked?
   *
   * @deprecated this must not be used when rendering items in React.
   */
  locked: boolean;
  /** Is this a masterwork? (D2 only) */
  masterwork: boolean;
  /** Is this classified? Some items are classified in the manifest. */
  classified: boolean;
  /** What percent complete is this item (considers XP and objectives). */
  percentComplete: number;
  /** Should we hide the percentage display? */
  hidePercentage: boolean;
  /** Can this be tagged? */
  taggable: boolean;
  /** Can this be compared with other items? */
  comparable: boolean;
  /** Can this be reviewed? */
  reviewable: boolean;
  /**
   * DIM tagging and notes info.
   *
   * @deprecated this must not be used when rendering items in React.
   */
  dimInfo: DimItemInfo;
  /** The "base power" without any power-enhancing mods. */
  basePower: number;
  /** A synthetic unique ID used to help Angular tell items apart. This changes to signal that Angular should re-render the item. */
  index: string;
  /** Can this be infused? */
  infusable: boolean;
  /** Can this be used as infusion fuel? */
  infusionFuel: boolean;
  /** The talent grid, used for D1 perks and D1/D2 subclass grids. */
  talentGrid: DimTalentGrid | null;
  /** Perks, which are specifically called-out special abilities of items shown in the game's popup UI. */
  perks: DimPerk[] | null;
  /** Detailed stats for the item. */
  stats: DimStat[] | null;
  /** Any objectives associated with the item. */
  objectives: DimObjective[] | null;
  /** Is this an engram? */
  isEngram: boolean;
  /** The reference hash for lore attached to this item (D2 only). */
  loreHash: number;
  /** A timestamp of when, in this session, the item was last manually moved */
  lastManuallyMoved: number;
  /** Sometimes the API doesn't return socket info. This tells whether the item *should* have socket info but doesn't. */
  missingSockets: boolean;

  /** Can this item be equipped by the given store? */
  canBeEquippedBy(store: DimStore): boolean;
  /** Could this be added to a loadout? */
  canBeInLoadout(): boolean;
  /** "Touch" the item to mark it as having been manually moved. */
  updateManualMoveTimestamp(): void;
  /** The Stores service associated with this item. */
  getStoresService(): StoreServiceType;

  /** Check if this item is from D1. Inside an if statement, this item will be narrowed to type D1Item. */
  isDestiny1(): this is D1Item;
  /** Check if this item is from D2. Inside an if statement, this item will be narrowed to type D2Item.s */
  isDestiny2(): this is D2Item;
}

/**
 * A Destiny 1 item. Use this type when you need specific D1 properties.
 */
export interface D1Item extends DimItem {
  primStat: D1PrimStat | null;
  talentGrid: D1TalentGrid | null;
  /** The overall item group (e.g. Weapons, Armor) this item is in. See InventoryBuckets. */
  sort?: string;
  stats: D1Stat[] | null;
  /** Armor quality evaluation. */
  quality: {
    /** The maximum stat range this armor could achieve when fully infused. */
    min: number;
    /** The minimum stat range this armor could achieve when fully infused. */
    max: number;
    /** A displayable range of percentages. */
    range: string;
  } | null;
  /** Which D1 "year" this item was associated with. */
  year: number;
  /** Hashes that allow us to figure out where this item can be found (what activities, locations, etc.) */
  sourceHashes: number[];
  /** Can this item be tracked? (For quests/bounties.) */
  trackable: boolean;

  getStoresService(): D1StoreServiceType;
}

/**
 * A Destiny 2 item. Use this type when you need specific D2 properties.
 */
export interface D2Item extends DimItem {
  /** D2 items use sockets and plugs to represent everything from perks to mods to ornaments and shaders. */
  sockets: DimSockets | null;
  /** Some items have a "flavor objective", such as emblems that track stats. */
  flavorObjective: DimFlavorObjective | null;
  /** If this item is a masterwork, this will include information about its masterwork properties. */
  masterworkInfo: DimMasterwork | null;
  /** for y3 armor, this is the type and capacity information */
  energy: DestinyItemInstanceEnergy | null;
  /** Information about how this item works with infusion. */
  infusionQuality: DestinyItemQualityBlockDefinition | null;
  /** More infusion information about what can be infused with the item. */
  infusionProcess: DestinyItemTierTypeInfusionBlock | null;
  /** The DestinyVendorDefinition hash of the vendor that can preview the contents of this item, if there is one. */
  previewVendor?: number;
  ammoType: DestinyAmmunitionType;
  /** The Destiny season that a specific item belongs to. */
  season: number;
  /** The Destiny event that a specific item belongs to. */
  event: D2EventEnum | null;
  /** The DestinyCollectibleDefinition sourceHash for a specific item. */
  source: number;
  displaySource?: string;

  /** The state of this item in the user's D2 Collection */
  collectibleState: DestinyCollectibleState | null;

  /** Extra pursuit info, if this item is a quest or bounty. */
  pursuit: DimPursuit | null;

  /** Information about this item as a plug. Mostly useful for mod collectibles. */
  plug?: {
    energyCost: number;
    costElementIcon: string;
  };

  getStoresService(): D2StoreServiceType;
}

export interface D1PrimStat extends DestinyStat {
  stat: DestinyStatDefinition & {
    statName: string;
    statIdentifier: string;
  };
}

export interface DimMasterwork {
  /** How much has the masterwork objective been progressed? This is usually kill counting. */
  // TODO: break this out and load it on demand when the item popup is opened
  progress?: number;
  /** Which type of masterwork is it? */
  typeName: 'Vanguard' | 'Crucible' | null;
  /** The icon associated with the type. */
  typeIcon: string;
  /** The localized description associated with the type. */
  typeDesc: string | null;
  /** The stat that is enhanced by this masterwork. */
  statHash?: number;
  /** The name of the stat enhanced by this masterwork. */
  statName?: string;
  /** The tier of the masterwork (not the same as the stat!). */
  tier?: number;
  /** How much the stat is enhanced by this masterwork. */
  statValue?: number;
}

export interface DimStat {
  /** DestinyStatDefinition hash. */
  statHash: number;
  /** Name, description, and icon for this stat. */
  displayProperties: DestinyDisplayPropertiesDefinition;
  /** Sort order. */
  sort: number;
  /** Absolute stat value. */
  value: number;
  /** Base stat without bonus perks applied. Important in D2 for armor. */
  base: number;
  /** The maximum value this stat can have. */
  maximumValue: number;
  /** Should this be displayed as a bar or just a number? */
  bar: boolean;
  /** Most stats, bigger is better. Exceptions are things like Charge Time. */
  smallerIsBetter: boolean;
  /**
   * Value of the investment stat, which may be different than the base stat.
   * This is really just a temporary value while building stats and shouldn't be used anywhere.
   */
  investmentValue: number;
  /**
   * Does this stat add to a character-wide total, instead of just being a stat for that item?
   * This is true of armor stats.
   */
  additive: boolean;
}

export interface D1Stat extends DimStat {
  bonus: number;
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
  /** Localized display of the objective status. */
  displayName: string;
  /** Localized description of the objective. */
  description?: string;
  /** Current value. */
  progress: number;
  /** Value at which this objective would be considered "complete". */
  completionValue: number;
  /** Is this complete? */
  complete: boolean;
  /** Is this a checkbox? */
  boolean: boolean;
  /** The actual string to display for the objective value (e.g "5/10" or "50%") */
  display?: string;
  /** Override display styles for objectives, such as 'trials' or 'integer' */
  // TODO: fold 'boolean' into this
  displayStyle: string | null;
}

export interface DimFlavorObjective {
  /** Localized description for the flavor objective. */
  description: string;
  /** Icon for the flavor objective. */
  icon: string;
  /** Current value of the tracker. */
  progress: number;
}

export interface DimTalentGrid {
  /** A flat list of nodes in the grid. */
  nodes: DimGridNode[];
  /** Is the grid complete (leveled and unlocked)? */
  complete: boolean;
}

export interface D1TalentGrid extends DimTalentGrid {
  nodes: D1GridNode[];
  /** Have all nodes been unlocked via XP? */
  xpComplete: boolean;
  /** How much XP in total to unlock the grid fully? */
  totalXPRequired: number;
  /** Total XP earned in the grid. */
  totalXP: number;
  /** Is there an "Ascend" action node? */
  hasAscendNode: boolean;
  /** Has this item been ascended? */
  ascended: boolean;
  /** Can this item be infused? */
  infusable: boolean;
  /** A representation of the perk grid for DTR integration. */
  dtrPerks: string;
  /** Another representation of the perk grid for DTR integration. */
  dtrRoll: string;
}

export interface DimGridNode {
  /** Localized name of the grid. */
  name: string;
  /** Talent grid definition hash. */
  hash: number;
  /** Localized description of the grid. */
  description: string;
  /** Icon of the grid. */
  icon: string;
  /** Column position in the grid. */
  column: number;
  /** Row position in the grid. */
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
  /** Is this an ornament node? */
  ornament: boolean;
  /** How much XP has been put into this node? */
  xp: number;
  /** How much XP is required to unlock the node? */
  xpRequired: number;
  /** Has the XP requirement been met? */
  xpRequirementMet: boolean;

  /** A representation of the node for DTR integration. */
  dtrHash: string | null;
  /** Another representation of the node for DTR integration. */
  dtrRoll: string;
}

/**
 * DIM's view of a "Plug" - an item that can go into a socket.
 * In D2, both perk grids and mods/shaders are sockets with plugs.
 */
export interface DimPlug {
  /** The item associated with this plug. */
  plugItem: DestinyInventoryItemDefinition;
  /** Perks associated with the use of this plug. TODO: load on demand? */
  perks: DestinySandboxPerkDefinition[];
  /** Objectives associated with this plug, usually used to unlock it. */
  plugObjectives: DestinyObjectiveProgress[];
  /** Is the plug enabled? For example, some perks only activate on certain planets. */
  enabled: boolean;
  /** If not enabled, this is the localized reasons why, as a single string. */
  enableFailReasons: string;
  /** Stats this plug modifies. If present, it's a map from the stat hash to the amount the stat is modified. */
  stats: {
    [statHash: number]: number;
  } | null;
}

export interface DimSocket {
  /** The index of this socket in the overall socket list, used for the AWA InsertPlug API. */
  socketIndex: number;
  /** The currently inserted plug item, if any. */
  plug: DimPlug | null;
  /**
   * The displayable/searchable list of potential plug choices for this socket.
   * For perks, this is all the potential perks in the perk column.
   * Otherwise, it'll just be the inserted plug for mods, shaders, etc.
   * Look at TODO to figure out the full list of possible plugs for this socket.
   */
  plugOptions: DimPlug[];
  /** Does the socket contain randomized plug items? */
  hasRandomizedPlugItems: boolean;
  /** Is this socket a perk? Anything else is at least sorta mod-like. TODO: should this be an enum? */
  isPerk: boolean;
  /** Deep information about this socket, including what types of things can be inserted into it. TODO: do we need all of this? */
  socketDefinition: DestinyItemSocketEntryDefinition;
}

export interface DimSocketCategory {
  /** A grouping of sockets. */
  category: DestinySocketCategoryDefinition;
  /** The sockets in the group. */
  sockets: DimSocket[];
}

export interface DimSockets {
  /** A flat list of all sockes on the item. */
  sockets: DimSocket[];
  /** Sockets grouped by category. */
  categories: DimSocketCategory[];
}

export interface DimPerk extends DestinySandboxPerkDefinition {
  /** Localized reason for why the perk can't be used. */
  requirement: string;
}

export interface DimPursuit {
  expirationDate?: Date;
  rewards: DestinyItemQuantity[];
  suppressExpirationWhenObjectivesComplete: boolean;
  expiredInActivityMessage?: string;
  /** place hash of places relevant to this quest */
  places: number[];
  /** place hash of places relevant to this quest */
  activityTypes: number[];
  /** Modifiers active in this quest */
  modifierHashes: number[];
}
