import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import {
  DestinyAmmunitionType,
  DestinyBreakerTypeDefinition,
  DestinyClass,
  DestinyCollectibleState,
  DestinyDamageTypeDefinition,
  DestinyDisplayPropertiesDefinition,
  DestinyEnergyTypeDefinition,
  DestinyInventoryItemDefinition,
  DestinyItemInstanceEnergy,
  DestinyItemPlugBase,
  DestinyItemQualityBlockDefinition,
  DestinyItemQuantity,
  DestinyItemSocketEntryDefinition,
  DestinyObjectiveProgress,
  DestinySandboxPerkDefinition,
  DestinySocketCategoryDefinition,
  DestinyStat,
  DestinyStatDefinition,
} from 'bungie-api-ts/destiny2';
import { InventoryBucket } from './inventory-buckets';

/** DIM's own Tier type. There's one in the Bungie API but the names are too confusing. */
export type Tier = 'Exotic' | 'Legendary' | 'Rare' | 'Uncommon' | 'Common' | 'Unknown' | 'Currency';

/**
 * A generic DIM item, representing almost anything. This completely represents any D2 item, and most D1 items,
 * though you can specialize down to the D1Item type for some special D1 properties and overrides.
 *
 * Prefer calculating values at the point of display instead of adding more stuff to this, and prefer making optional
 * properties instead of "| null".
 */
// TODO: This interface is clearly too large - break out interfaces for common subsets
// TODO: separate out "mutable" vs "immutable" data
export interface DimItem {
  // Static data - this won't ever change for the lifetime of the item, because it's derived from the definition or is intrinsic to the item's identity. These would only change if the manifest updates.

  /** A synthetic unique ID used to help React tell items apart. Use this as a "key" property. We can't just use "id" because some items don't have one. */
  index: string;
  /** Item instance id. Non-instanced items have id "0" for D1 compatibility. */
  id: string;
  /** The inventoryItemHash, see DestinyInventoryItemDefinition. */
  hash: number;
  /** Is this classified? Some items are classified in the manifest. */
  classified: boolean;
  /** The version of Destiny this comes from. */
  destinyVersion: DestinyVersion;
  /** This is the type of the item (see InventoryBuckets) regardless of location. This string is a DIM concept with no direct correlation to the API types. It should generally be avoided in favor of using bucket hash.  */
  type: string;
  /** Localized name of this item's type. */
  typeName: string;
  /** The bucket the item normally resides in (even though it may currently be elsewhere, such as in the postmaster). */
  bucket: InventoryBucket;
  /** Hashes of DestinyItemCategoryDefinitions this item belongs to */
  itemCategoryHashes: number[];
  /** A readable English name for the rarity of the item (e.g. "Exotic", "Rare"). */
  tier: Tier;
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
  /** Hidden Icon overlay path for the item. Currently used to assess event data and seasons for some items when no overlay is shown */
  hiddenOverlay?: string;
  /** Icon overlay path for the item. Currently used to correct old season icons into new ones for reissued items */
  iconOverlay?: string;
  /** Some items have a secondary icon, namely Emblems. */
  secondaryIcon?: string;
  /** Whether we can pull this item from the postmaster */
  canPullFromPostmaster: boolean;
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
  /** What type of ammo this weapon takes, or None if it isn't a weapon */
  ammoType: DestinyAmmunitionType;
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
  /** Whether this item can be locked. */
  lockable: boolean;
  /** Can this item be tracked? (For quests/bounties.) */
  trackable: boolean;
  /** Can this be tagged? */
  taggable: boolean;
  /** Can this be compared with other items? */
  comparable: boolean;
  /** Should we hide the percentage display? */
  hidePercentage: boolean;
  /** Can this be infused? */
  infusable: boolean;
  /** Can this be used as infusion fuel? */
  infusionFuel: boolean;
  /** Perks, which are specifically called-out special abilities of items shown in the game's popup UI. */
  perks: DimPerk[] | null;
  /** Is this an engram? */
  isEngram: boolean;
  /** The reference hash for lore attached to this item (D2 only). */
  loreHash?: number;
  /** Metrics that can be used with this item. */
  availableMetricCategoryNodeHashes?: number[];
  /** If this exists, it's the limit of an item's PL. If NOT, display no information. Maybe it's unlimited PL. Maybe it's a weird item. */
  powerCap: number | null;
  /** Information about how this item works with infusion. */
  infusionQuality: DestinyItemQualityBlockDefinition | null;
  /** The DestinyVendorDefinition hash of the vendor that can preview the contents of this item, if there is one. */
  previewVendor?: number;
  /** Localized string for where this item comes from... or other stuff like it not being recoverable from collections */
  displaySource?: string;
  collectibleHash?: number;
  /** The DestinyCollectibleDefinition sourceHash for a specific item (D2). Derived entirely from collectibleHash */
  source?: number;
  /** Information about this item as a plug. Mostly useful for mod collectibles. */
  plug?: {
    energyCost: number;
    costElementIcon: string;
  };
  /** Extra pursuit info, if this item is a quest or bounty. */
  pursuit: DimPursuit | null;

  // "Mutable" data - this may be changed by moving the item around, lock/unlock, etc. Any place DIM updates its view of the world without a profile refresh. This info is always reset to server truth on a refresh.

  /** The ID of the store that currently contains this item. */
  owner: string;
  /** Is this item currently equipped? */
  equipped: boolean;
  /** The bucket the item is currently in. */
  location: InventoryBucket;
  /** Is this item tracked? (For quests/bounties). */
  tracked: boolean;
  /** Is this item locked? */
  locked: boolean;

  // Dynamic data - this may change between profile updates

  /** The damage type this weapon deals, or energy type of armor, or damage type corresponding to the item's elemental resistance. */
  element: DestinyDamageTypeDefinition | DestinyEnergyTypeDefinition | null;
  /** Whether this item CANNOT be transferred. */
  notransfer: boolean;
  /** Is this item complete (leveled, unlocked, objectives complete)? */
  complete: boolean;
  /** How many items does this represent? Only greater than one if maxStackSize is greater than one. */
  amount: number;
  /** The primary stat (Attack, Defense, Speed) of the item. */
  primStat:
    | (DestinyStat & {
        stat: DestinyStatDefinition;
      })
    | null;
  /** The "base power" without any power-enhancing mods. This is only defined for D2 and is a synonym for (primStat?.value || 0). */
  basePower: number;
  /** Is this a masterwork? (D2 only) */
  masterwork: boolean;
  /** What percent complete is this item (considers XP and objectives). */
  percentComplete: number;
  /** The talent grid, used for D1 perks and D1/D2 subclass grids. */
  talentGrid: DimTalentGrid | null;
  /** D2 items use sockets and plugs to represent everything from perks to mods to ornaments and shaders. */
  sockets: DimSockets | null;
  /** Sometimes the API doesn't return socket info. This tells whether the item *should* have socket info but doesn't. */
  missingSockets: boolean;
  /** Detailed stats for the item. */
  stats: DimStat[] | null;
  /** Any objectives associated with the item. */
  objectives: DestinyObjectiveProgress[] | null;
  /** Stat Tracker */
  metricHash?: number;
  /** Stat Tracker Progress */
  metricObjective?: DestinyObjectiveProgress;
  /** for D2 Y3 armor, this is the type and capacity information */
  energy: DestinyItemInstanceEnergy | null;
  /** If this item is a masterwork, this will include information about its masterwork properties. */
  masterworkInfo: DimMasterwork | null;
  /** an item's current breaker type, if it has one */
  breakerType: DestinyBreakerTypeDefinition | null;
  /** The state of this item in the user's D2 Collection */
  collectibleState?: DestinyCollectibleState;
}

/**
 * A Destiny 1 item. Use this type when you need specific D1 properties.
 */
export interface D1Item extends DimItem {
  talentGrid: D1TalentGrid | null;
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
  /** Hashes that allow us to figure out where this item can be found (what activities, locations, etc.) */
  sourceHashes: number[];
}

export interface DimMasterwork {
  /** The tier of the masterwork (not the same as the stat!). */
  tier?: number;
  /** The stats that are enhanced by this masterwork. */
  stats?: {
    hash?: number;
    /** The name of the stat enhanced by this masterwork. */
    name?: string;
    /** How much the stat is enhanced by this masterwork. */
    value?: number;
  }[];
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
  /** If negative mods are found and the investment stat is 0, the base value may be incorrect */
  baseMayBeWrong?: boolean;
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
}

/** an InventoryItem known to have a plug attribute, because this item is located in a socket */
export interface PluggableInventoryItemDefinition extends DestinyInventoryItemDefinition {
  plug: NonNullable<DestinyInventoryItemDefinition['plug']>;
}

/**
 * DIM's view of a "Plug" - an item that can go into a socket.
 * In D2, both perk grids and mods/shaders are sockets with plugs.
 */
export interface DimPlug {
  /** The InventoryItem definition associated with this plug. */
  plugDef: PluggableInventoryItemDefinition;
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
  plugged: DimPlug | null;
  /**
   * The displayable/searchable list of potential plug choices for this socket.
   * For perks, this is all the potential perks in the perk column.
   * Otherwise, it'll just be the inserted plug for mods, shaders, etc.
   * Look at TODO to figure out the full list of possible plugs for this socket.
   */
  plugOptions: DimPlug[];
  /** Plug hashes in this item visible in the collections roll, if this is a perk */
  curatedRoll: number[] | null;
  /** Reusable plug items from runtime info, for the plug viewer. */
  reusablePlugItems?: DestinyItemPlugBase[];
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
  allSockets: DimSocket[];
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
  /** Modifiers active in this quest */
  modifierHashes: number[];
}
