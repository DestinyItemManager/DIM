import { IPromise } from 'angular';
import {
  DestinyClass,
  DestinyInventoryItemDefinition,
  DestinyInventoryItemStatDefinition,
  DestinyItemComponent,
  DestinyItemComponentSetOfint64,
  DestinyItemInstanceComponent,
  DestinyItemInvestmentStatDefinition,
  DestinyItemObjectivesComponent,
  DestinyItemQualityBlockDefinition,
  DestinyItemSocketsComponent,
  DestinyItemStatsComponent,
  DestinyItemTalentGridComponent,
  DestinyItemTierTypeInfusionBlock,
  DestinyObjectiveDefinition,
  DestinyObjectiveProgress,
  DestinySandboxPerkDefinition,
  DestinySocketCategoryDefinition,
  DestinyStat,
  DestinyStatDefinition,
  DestinyTalentGridDefinition,
  ItemLocation,
  TransferStatuses,
  DestinyUnlockValueUIStyle
  } from 'bungie-api-ts/destiny2';
import * as _ from 'underscore';
import { getBuckets, DimInventoryBucket, DimInventoryBuckets } from '../../destiny2/d2-buckets.service';
import { getDefinitions, D2ManifestDefinitions, LazyDefinition } from '../../destiny2/d2-definitions.service';
import { reportException } from '../../exceptions';
import { sum } from '../../util';
import { D2ManifestService } from '../../manifest/manifest-service';
import { getClass } from './character-utils';
import { DimStore } from './d2-store-factory.service';
import { NewItemsService } from './new-items.service';
import { DimItemInfo, ItemInfoSource } from '../dim-item-info';
import { $q } from 'ngimport';
import { t } from 'i18next';
import { DtrUserReview } from '../../item-review/destiny-tracker.service';

// Maps tierType to tierTypeName in English
const tiers = [
  'Unknown',
  'Currency',
  'Common',
  'Uncommon',
  'Rare',
  'Legendary',
  'Exotic'
];

export interface EnhancedStat extends DestinyStat {
  stat: DestinyStatDefinition & { statName: string };
}

export interface DimStat {
  base: number;
  bonus: number;
  statHash: number;
  name: string;
  id: number;
  sort: number;
  value: number;
  maximumValue: number;
  bar: boolean;
}

export interface DimObjective {
  displayName: string;
  description: string;
  progress: number;
  completionValue: number;
  complete: boolean;
  boolean: boolean;
  display: string;
  displayStyle: string | null;
}

export interface DimFlavorObjective {
  description: string;
  icon: string;
  progress: number;
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

export interface DimTalentGrid {
  nodes: DimGridNode[];
  complete: boolean;
}

export interface DestinyInventoryItemDefinitionWithRating extends DestinyInventoryItemDefinition {
  bestRated?: boolean;
}

export interface DimSocket {
  plug: DestinyInventoryItemDefinition | null;
  reusablePlugs: DestinyInventoryItemDefinition[];
  enabled: boolean;
  enableFailReasons: string;
  plugOptions: DestinyInventoryItemDefinitionWithRating[];
  plugOptionsPerks: DestinySandboxPerkDefinition[];
  plugObjectives: DestinyObjectiveProgress[];
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

// TODO: This interface is clearly too large
export interface DimItem {
  owner: string;
  /** The version of Destiny this comes from */
  destinyVersion: 1 | 2;
  /** The bucket the item is currently in */
  location: DimInventoryBucket;
  /** The bucket the item normally resides in (even though it may be in the vault/postmaster) */
  bucket: DimInventoryBucket;
  hash: number;
  /** This is the type of the item (see D2Category/D2Buckets) regardless of location */
  type: string;
  categories: string[];
  tier: string;
  isExotic: boolean;
  isVendorItem: boolean;
  name: string;
  description: string;
  icon: string;
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
  primStat: EnhancedStat | null;
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
  sockets: DimSockets | null;
  percentComplete: number;
  hidePercentage: boolean;
  talentGrid?: DimTalentGrid | null;
  stats: DimStat[] | null;
  objectives: DimObjective[] | null;
  taggable: boolean;
  comparable: boolean;
  reviewable: boolean;
  isNew: boolean;
  dimInfo: DimItemInfo;
  perks: DimPerk[] | null;
  basePower: number;
  index: string;
  infusionProcess: DestinyItemTierTypeInfusionBlock | null;
  infusable: boolean;
  infusionQuality: DestinyItemQualityBlockDefinition | null;
  infusionFuel: boolean;
  masterworkInfo: DimMasterwork | null;
  _isEngram: boolean;
  /** A timestamp of when, in this session, the item was last manually moved */
  lastManuallyMoved: number;
  flavorObjective: DimFlavorObjective | null;
  weaponOrArmor: boolean;

  // TODO: this should be on a separate object, with the other DTR stuff
  pros: string;
  cons: string;
  userRating: number;
  userReview: string;
  userVote: number;
  dtrRating: number;
  dtrRatingCount: number;
  dtrHighlightedRatingCount: number;
  reviews: DtrUserReview[];
  userReviewPros: string;
  userReviewCons: string;
  ratingCount: number;

  /** Can this item be equipped by the given store? */
  canBeEquippedBy(store: DimStore): boolean;
  inCategory(categoryName: string): boolean;
  isEngram(): boolean;
  canBeInLoadout(): boolean;
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

/**
 * A factory service for producing DIM inventory items.
 */

let _idTracker = {};
// A map from instance id to the last time it was manually moved this session
const _moveTouchTimestamps: Map<string, number> = new Map();

const statWhiteList = [
  4284893193, // Rounds Per Minute
  2961396640, // Charge Time
  3614673599, // Blast Radius
  2523465841, // Velocity
  4043523819, // Impact
  1240592695, // Range
  155624089, // Stability
  943549884, // Handling
  4188031367, // Reload Speed
  1345609583, // Aim Assistance
  2715839340, // Recoil Direction
  3555269338, // Zoom
  3871231066, // Magazine
  2996146975, // Mobility
  392767087, // Resilience
  1943323491 // Recovery
  //    1935470627, // Power
  //    1931675084, //  Inventory Size
  // there are a few others (even an `undefined` stat)
];

// Mapping from itemCategoryHash to our category strings for filtering.
const categoryFromHash = {
  // These three types are missing.
  // ???: 'CATEGORY_GRENADE_LAUNCHER',
  // ???: 'CATEGORY_SUBMACHINEGUN',
  // ???: 'CATEGORY_TRACE_RIFLE',
  5: 'CATEGORY_AUTO_RIFLE',
  6: 'CATEGORY_HAND_CANNON',
  7: 'CATEGORY_PULSE_RIFLE',
  8: 'CATEGORY_SCOUT_RIFLE',
  9: 'CATEGORY_FUSION_RIFLE',
  10: 'CATEGORY_SNIPER_RIFLE',
  11: 'CATEGORY_SHOTGUN',
  13: 'CATEGORY_ROCKET_LAUNCHER',
  14: 'CATEGORY_SIDEARM',
  54: 'CATEGORY_SWORD',
};

// Mapping from infusionCategoryHash to our category strings for
// cases where the itemCategory is missing.
// TODO: Remove this once the bug in the API is fixed.
const categoryFromInfusionHash = {
  3879234379: 'CATEGORY_GRENADE_LAUNCHER',
  3499784695: 'CATEGORY_SUBMACHINEGUN',
  522776512: 'CATEGORY_AUTO_RIFLE', // Trace Rifle
};

// Prototype for Item objects - add methods to this to add them to all
// items.
const ItemProto = {
  // Can this item be equipped by the given store?
  canBeEquippedBy(store) {
    if (store.isVault) {
      return false;
    }

    return this.equipment &&
      // For the right class
      (this.classTypeName === 'unknown' || this.classTypeName === store.class) &&
      // nothing we are too low-level to equip
      this.equipRequiredLevel <= store.level &&
      // can be moved or is already here
      (!this.notransfer || this.owner === store.id) &&
      !this.location.inPostmaster;
  },
  inCategory(categoryName) {
    return this.categories.includes(categoryName);
  },
  isEngram() {
    return this._isEngram;
  },
  canBeInLoadout() {
    return this.equipment || this.type === 'Material' || this.type === 'Consumable';
  },
  // Mark that this item has been moved manually
  updateManualMoveTimestamp() {
    this.lastManuallyMoved = Date.now();
    if (this.id !== '0') {
      _moveTouchTimestamps.set(this.id, this.lastManuallyMoved);
    }
  }
};

export function resetIdTracker() {
  _idTracker = {};
}

/**
 * Process an entire list of items into DIM items.
 * @param owner the ID of the owning store.
 * @param items a list of "raw" items from the Destiny API
 * @param previousItems a set of item IDs representing the previous store's items
 * @param newItems a set of item IDs representing the previous list of new items
 * @param itemInfoService the item info factory for this store's platform
 * @return a promise for the list of items
 */
export function processItems(
  owner: DimStore,
  items: DestinyItemComponent[],
  itemComponents: DestinyItemComponentSetOfint64,
  previousItems: Set<string> = new Set(),
  newItems: Set<string> = new Set(),
  itemInfoService: ItemInfoSource): IPromise<DimItem[]> {
  return $q.all([
    getDefinitions(),
    getBuckets()])
    .then(([defs, buckets]) => {
      const result: DimItem[] = [];
      D2ManifestService.statusText = `${t('Manifest.LoadCharInv')}...`;
      _.each(items, (item) => {
        let createdItem: DimItem | null = null;
        try {
          createdItem = makeItem(defs, buckets, previousItems, newItems, itemInfoService, itemComponents, item, owner);
        } catch (e) {
          console.error("Error processing item", item, e);
          reportException('Processing D2 item', e);
        }
        if (createdItem !== null) {
          createdItem.owner = owner.id;
          result.push(createdItem);
        }
      });
      return result;
    });
}

/** Set an ID for the item that should be unique across all items */
export function createItemIndex(item: DimItem): string {
  // Try to make a unique, but stable ID. This isn't always possible, such as in the case of consumables.
  let index = item.id;
  if (item.id === '0') {
    index = `${item.hash}-am${item.amount}`;
    _idTracker[index] = (_idTracker[index] || 0) + 1;
    index = `${index}-t${_idTracker[index]}`;
  }

  // Perf hack: the index is used as a key for ng-repeat. What we are doing here
  // is adding extra info to that key in order to force items to be re-rendered when
  // this index changes. These properties are selected because they're used in the
  // dimStoreItem directive. Ideally this would just be a hash of all these properties,
  // but for now a big string will do.
  //
  // Oh, also, this value needs to be safe as an HTML ID.

  if (!item.complete && item.percentComplete) {
    index += `-pc${Math.round(item.percentComplete * 100)}`;
  }
  if (item.primStat && item.primStat.value) {
    index += `-ps${item.primStat.value}`;
  }

  return index;
}

/**
 * Construct the search category (CATEGORY_*) list from an item definition.
 * @param itemDef the item definition object
 */
function findCategories(itemDef): string[] {
  const categories: string[] = [];
  if (itemDef.itemCategoryHashes) {
    for (const hash of itemDef.itemCategoryHashes) {
      const c = categoryFromHash[hash];
      if (c) { categories.push(c); }
    }
  }
  // TODO: Some of our categories are not yet available as
  // ItemCategories. This is a hack.
  if (categories.length === 0 && itemDef.quality) {
    const c = categoryFromInfusionHash[itemDef.quality.infusionCategoryHash];
    if (c) { categories.push(c); }
  }
  return categories;
}

/**
 * Process a single raw item into a DIM item.
 * @param defs the manifest definitions
 * @param buckets the bucket definitions
 * @param previousItems a set of item IDs representing the previous store's items
 * @param newItems a set of item IDs representing the previous list of new items
 * @param itemInfoService the item info factory for this store's platform
 * @param item "raw" item from the Destiny API
 * @param owner the ID of the owning store.
 */
function makeItem(
  defs: D2ManifestDefinitions,
  buckets: DimInventoryBuckets,
  previousItems: Set<string>,
  newItems: Set<string>,
  itemInfoService: ItemInfoSource,
  itemComponents: DestinyItemComponentSetOfint64,
  item: DestinyItemComponent,
  owner: DimStore
): DimItem | null {
  const itemDef = defs.InventoryItem.get(item.itemHash);
  const instanceDef: Partial<DestinyItemInstanceComponent> = item.itemInstanceId ? itemComponents.instances.data[item.itemInstanceId] : {};
  // Missing definition?
  if (!itemDef) {
    D2ManifestService.warnMissingDefinition();
    return null;
  }

  if (itemDef.redacted) {
    console.warn('Missing Item Definition:\n\n', { item, itemDef, instanceDef }, '\n\nThis item is not in the current manifest and will be added at a later time by Bungie.');
  }

  if (!itemDef || !itemDef.displayProperties.name) {
    return null;
  }

  // def.bucketTypeHash is where it goes normally
  let normalBucket = buckets.byHash[itemDef.inventory.bucketTypeHash];
  // item.bucket is where it IS right now
  let currentBucket = buckets.byHash[item.bucketHash] || normalBucket;
  if (!normalBucket) {
    currentBucket = normalBucket = buckets.unknown;
    buckets.setHasUnknown();
  }

  // We cheat a bit for items in the vault, since we treat the
  // vault as a character. So put them in the bucket they would
  // have been in if they'd been on a character.
  if (owner.isVault || item.location === ItemLocation.Vault) {
    currentBucket = normalBucket;
  }

  const itemType = normalBucket.type || 'Unknown';

  const categories = findCategories(itemDef);

  const dmgName = [null, 'kinetic', 'arc', 'solar', 'void', 'raid'][instanceDef.damageType || 0];

  // https://github.com/Bungie-net/api/issues/134, class items had a primary stat
  const primaryStat = itemType === 'Class' ? null : instanceDef.primaryStat || null;

  const createdItem: DimItem = Object.assign(Object.create(ItemProto), {
    // figure out what year this item is probably from
    destinyVersion: 2,
    // The bucket the item is currently in
    location: currentBucket,
    // The bucket the item normally resides in (even though it may be in the vault/postmaster)
    bucket: normalBucket,
    hash: item.itemHash,
    // This is the type of the item (see D2Category/D2Buckets) regardless of location
    type: itemType,
    categories, // see defs.ItemCategories
    tier: tiers[itemDef.inventory.tierType] || 'Common',
    isExotic: tiers[itemDef.inventory.tierType] === 'Exotic',
    isVendorItem: (!owner || owner.id === null),
    name: itemDef.displayProperties.name,
    description: itemDef.displayProperties.description,
    icon: itemDef.displayProperties.icon || '/img/misc/missing_icon_d2.png',
    notransfer: Boolean(itemDef.nonTransferrable ||
      item.transferStatus === TransferStatuses.NotTransferrable),
    canPullFromPostmaster: !itemDef.doesPostmasterPullHaveSideEffects,
    id: item.itemInstanceId || '0', // zero for non-instanced is legacy hack
    equipped: Boolean(instanceDef.isEquipped),
    equipment: Boolean(itemDef.equippingBlock), // TODO: this has a ton of good info for the item move logic
    equippingLabel: itemDef.equippingBlock && itemDef.equippingBlock.uniqueLabel,
    complete: false,
    amount: item.quantity,
    primStat: primaryStat,
    typeName: itemDef.itemTypeDisplayName || 'Unknown',
    equipRequiredLevel: instanceDef.equipRequiredLevel || 0,
    maxStackSize: Math.max(itemDef.inventory.maxStackSize, 1),
    // 0: titan, 1: hunter, 2: warlock, 3: any
    classType: itemDef.classType,
    classTypeName: getClass(itemDef.classType),
    classTypeNameLocalized: getClassTypeNameLocalized(defs, itemDef.classType),
    dmg: dmgName,
    visible: true,
    lockable: item.lockable,
    tracked: item.state & 2,
    locked: item.state & 1,
    masterwork: item.state & 4,
    classified: Boolean(itemDef.redacted),
    _isEngram: itemDef.itemCategoryHashes ? itemDef.itemCategoryHashes.includes(34) : false, // category hash for engrams
    lastManuallyMoved: item.itemInstanceId ? _moveTouchTimestamps.get(item.itemInstanceId) || 0 : 0,
    isInLoadout: false,
    percentComplete: 0, // filled in later
    hidePercentage: false,
    talentGrid: null, // filled in later
    stats: null, // filled in later
    objectives: null, // filled in later
  });

  // *able
  createdItem.taggable = Boolean(createdItem.lockable || createdItem.classified);
  createdItem.comparable = Boolean(createdItem.equipment && createdItem.lockable);
  createdItem.reviewable = Boolean($featureFlags.reviewsEnabled && isWeaponOrArmor(createdItem));

  createdItem.weaponOrArmor = Boolean(isWeaponOrArmor(createdItem));

if (createdItem.primStat) {
    const statDef = defs.Stat.get(createdItem.primStat.statHash);
    // TODO: hey, does this work?
    createdItem.primStat.stat = Object.create(statDef);
    createdItem.primStat.stat.statName = statDef.displayProperties.name;
  }

  // An item is new if it was previously known to be new, or if it's new since the last load (previousItems);
  createdItem.isNew = false;
  try {
    createdItem.isNew = NewItemsService.isItemNew(createdItem.id, previousItems, newItems);
  } catch (e) {
    console.error(`Error determining new-ness of ${createdItem.name}`, item, itemDef, e);
  }

  if (itemInfoService) {
    try {
      createdItem.dimInfo = itemInfoService.infoForItem(createdItem.hash, createdItem.id);
    } catch (e) {
      console.error(`Error getting extra DIM info for ${createdItem.name}`, item, itemDef, e);
    }
  }

  try {
    if (itemDef.stats && itemDef.stats.stats) {
      createdItem.stats = _.sortBy((buildStats(item, itemComponents.stats.data, defs.Stat)).concat(
        buildHiddenStats(itemDef, defs.Stat)
      ), 'sort');
    }
    if (!createdItem.stats && itemDef.investmentStats && itemDef.investmentStats.length) {
      createdItem.stats = _.sortBy(buildInvestmentStats(itemDef.investmentStats, defs.Stat));
    }
  } catch (e) {
    console.error(`Error building stats for ${createdItem.name}`, item, itemDef, e);
  }

  try {
    createdItem.talentGrid = buildTalentGrid(item, itemComponents.talentGrids.data, defs.TalentGrid);
  } catch (e) {
    console.error(`Error building talent grid for ${createdItem.name}`, item, itemDef, e);
  }

  try {
    createdItem.objectives = buildObjectives(item, itemComponents.objectives.data, defs.Objective);
  } catch (e) {
    console.error(`Error building objectives for ${createdItem.name}`, item, itemDef, e);
  }

  try {
    createdItem.flavorObjective = buildFlavorObjective(item, itemComponents.objectives.data, defs.Objective);
  } catch (e) {
    console.error(`Error building flavor objectives for ${createdItem.name}`, item, itemDef, e);
  }

  try {
    createdItem.sockets = buildSockets(item, itemComponents.sockets.data, defs, itemDef);
  } catch (e) {
    console.error(`Error building sockets for ${createdItem.name}`, item, itemDef, e);
  }

  if (itemDef.perks && itemDef.perks.length) {
    createdItem.perks = itemDef.perks.map((p): DimPerk => {
      return { requirement: p.requirementDisplayString, ...defs.SandboxPerk.get(p.perkHash) };
    }).filter((p) => p.isDisplayable);
    if (createdItem.perks.length === 0) {
      createdItem.perks = null;
    }
  }

  if (createdItem.objectives) {
    // Counter objectives for the new emblems shouldn't count.
    const realObjectives = createdItem.objectives.filter((o) => o.displayStyle !== 'integer');

    const length = realObjectives.length;
    if (length > 0) {
      createdItem.complete = realObjectives.every((o) => o.complete);
      createdItem.percentComplete = sum(createdItem.objectives, (objective) => {
        if (objective.completionValue) {
          return Math.min(1, objective.progress / objective.completionValue) / length;
        } else {
          return 0;
        }
      });
    } else {
      createdItem.hidePercentage = true;
    }
  }

  // Infusion
  const tier = itemDef.inventory ? defs.ItemTierType[itemDef.inventory.tierTypeHash] : null;
  createdItem.infusionProcess = tier && tier.infusionProcess;
  createdItem.infusionFuel = Boolean(createdItem.infusionProcess && itemDef.quality && itemDef.quality.infusionCategoryHashes && itemDef.quality.infusionCategoryHashes.length);
  createdItem.infusable = createdItem.infusionFuel && isLegendaryOrBetter(createdItem);
  createdItem.infusionQuality = itemDef.quality || null;

  // Masterwork
  if (createdItem.masterwork && createdItem.sockets) {
    try {
      createdItem.masterworkInfo = buildMasterworkInfo(createdItem.sockets, defs);
    } catch (e) {
      console.error(`Error building masterwork info for ${createdItem.name}`, item, itemDef, e);
    }
  }

  // Mark items with power mods
  if (createdItem.primStat) {
    createdItem.basePower = getBasePowerLevel(createdItem);
    if (createdItem.basePower !== createdItem.primStat.value) {
      createdItem.complete = true;
    }
  }

  // Mark upgradeable stacks of rare modifications
  if (createdItem.maxStackSize > 1 &&
      createdItem.amount >= 3 &&
      createdItem.tier === 'Rare' &&
      createdItem.bucket.id === 3313201758) {
    createdItem.complete = true;
  }

  createdItem.index = createItemIndex(createdItem);

  return createdItem;
}

function isWeaponOrArmor(item: DimItem) {
  return item.primStat &&
          ((item.primStat.statHash === 1480404414) || // weapon
          (item.primStat.statHash === 3897883278)); // armor
}

function isLegendaryOrBetter(item) {
  return (item.tier === 'Legendary' || item.tier === 'Exotic');
}

function getClassTypeNameLocalized(defs: D2ManifestDefinitions, type: DestinyClass) {
  const klass = _.find(Object.values(defs.Class), { classType: type });
  if (klass) {
    return klass.displayProperties.name;
  } else {
    return t('Loadouts.Any');
  }
}

function buildHiddenStats(itemDef: DestinyInventoryItemDefinition, statDefs: LazyDefinition<DestinyStatDefinition>): DimStat[] {
  const itemStats = itemDef.stats.stats;

  if (!itemStats) {
    return [];
  }

  return _.compact(_.map(itemStats, (stat: DestinyInventoryItemStatDefinition): DimStat | undefined => {
    const def = statDefs.get(stat.statHash);

    // only aim assist and zoom for now
    if (![1345609583, 3555269338, 2715839340].includes(stat.statHash) || !stat.value) {
      return undefined;
    }

    return {
      base: stat.value,
      bonus: 0,
      statHash: stat.statHash,
      name: def.displayProperties.name,
      id: stat.statHash,
      sort: statWhiteList.indexOf(stat.statHash),
      value: stat.value,
      maximumValue: 100,
      bar: true
    };
  })) as DimStat[];
}

function buildStats(
  item: DestinyItemComponent,
  stats: { [key: string]: DestinyItemStatsComponent },
  statDefs: LazyDefinition<DestinyStatDefinition>
): DimStat[] {
  if (!item.itemInstanceId || !stats[item.itemInstanceId]) {
    return [];
  }
  const itemStats = stats[item.itemInstanceId].stats;

  return _.compact(_.map(itemStats, (stat: DestinyStat): DimStat | undefined => {
    const def = statDefs.get(stat.statHash);
    const itemStat = itemStats[stat.statHash];
    if (!def || !itemStat) {
      return undefined;
    }

    const val = itemStat ? itemStat.value : stat.value;

    return {
      base: val,
      bonus: 0,
      statHash: stat.statHash,
      name: def.displayProperties.name,
      id: stat.statHash,
      sort: statWhiteList.indexOf(stat.statHash),
      value: val,
      maximumValue: itemStat.maximumValue,
      bar: stat.statHash !== 4284893193 &&
      stat.statHash !== 3871231066 &&
      stat.statHash !== 2961396640
    };
  })) as DimStat[];
}

function buildInvestmentStats(
  itemStats: DestinyItemInvestmentStatDefinition[],
  statDefs: LazyDefinition<DestinyStatDefinition>
): DimStat[] {
  return _.compact(_.map(itemStats, (itemStat): DimStat | undefined => {
    const def = statDefs.get(itemStat.statTypeHash);
    /* 1935470627 = Power */
    if (!def || !itemStat || itemStat.statTypeHash === 1935470627) {
      return undefined;
    }

    return {
      base: itemStat.value,
      bonus: 0,
      statHash: itemStat.statTypeHash,
      name: def.displayProperties.name,
      id: itemStat.statTypeHash,
      sort: statWhiteList.indexOf(itemStat.statTypeHash),
      value: itemStat.value,
      maximumValue: 0,
      bar: false
    };
  })) as DimStat[];
}

function buildObjectives(
  item: DestinyItemComponent,
  objectivesMap: { [key: string]: DestinyItemObjectivesComponent },
  objectiveDefs: LazyDefinition<DestinyObjectiveDefinition>
): DimObjective[] | null {

  if (!item.itemInstanceId || !objectivesMap[item.itemInstanceId]) {
    return null;
  }

  const objectives = objectivesMap[item.itemInstanceId].objectives;
  if (!objectives || !objectives.length) {
    return null;
  }

  // TODO: we could make a tooltip with the location + activities for each objective (and maybe offer a ghost?)

  return objectives.map((objective) => {
    const def = objectiveDefs.get(objective.objectiveHash);

    return {
      displayName: def.displayProperties.name || def.progressDescription ||
        (objective.complete
          ? t('Objectives.Complete')
          : t('Objectives.Incomplete')),
      description: def.displayProperties.description,
      progress: objective.progress || 0,
      completionValue: def.completionValue,
      complete: def.valueStyle === DestinyUnlockValueUIStyle.Integer ? false : objective.complete,
      boolean: def.completionValue === 1 && (def.valueStyle === DestinyUnlockValueUIStyle.Checkbox || def.valueStyle === DestinyUnlockValueUIStyle.Automatic),
      displayStyle: def.valueStyle === DestinyUnlockValueUIStyle.Integer ? 'integer' : null,
      display: `${objective.progress || 0}/${def.completionValue}`
    };
  });
}

function buildFlavorObjective(
  item: DestinyItemComponent,
  objectivesMap: { [key: string]: DestinyItemObjectivesComponent },
  objectiveDefs: LazyDefinition<DestinyObjectiveDefinition>
): DimFlavorObjective | null {
  if (!item.itemInstanceId || !objectivesMap[item.itemInstanceId]) {
    return null;
  }

  const flavorObjective = objectivesMap[item.itemInstanceId].flavorObjective;
  if (!flavorObjective) {
    return null;
  }

  // Fancy emblems with multiple trackers are tracked as regular objectives, but the info is duplicated in
  // flavor objective. If that's the case, skip flavor.
  const objectives = objectivesMap[item.itemInstanceId].objectives;
  if (objectives && objectives.some((o) => o.objectiveHash === flavorObjective.objectiveHash)) {
    return null;
  }

  const def = objectiveDefs.get(flavorObjective.objectiveHash);
  return {
    description: def.progressDescription,
    icon: def.displayProperties.hasIcon ? def.displayProperties.icon : "",
    progress: def.valueStyle === 5 ? (flavorObjective.progress || 0) / def.completionValue : (def.valueStyle === 6 ? flavorObjective.progress : 0) || 0
  };
}

function buildTalentGrid(
  item: DestinyItemComponent,
  talentsMap: { [key: string]: DestinyItemTalentGridComponent },
  talentDefs: LazyDefinition<DestinyTalentGridDefinition>
): DimTalentGrid | null {
  if (!item.itemInstanceId || !talentsMap[item.itemInstanceId]) {
    return null;
  }
  const talentGrid = talentsMap[item.itemInstanceId];
  if (!talentGrid) {
    return null;
  }

  const talentGridDef = talentDefs.get(talentGrid.talentGridHash);
  if (!talentGridDef || !talentGridDef.nodes || !talentGridDef.nodes.length) {
    return null;
  }

  const gridNodes = _.compact(talentGridDef.nodes.map((node): DimGridNode | undefined => {
    const talentNodeGroup = node;
    const talentNodeSelected = node.steps[0];

    if (!talentNodeSelected) {
      return undefined;
    }

    const nodeName = talentNodeSelected.displayProperties.name;

    // Filter out some weird bogus nodes
    if (!nodeName || nodeName.length === 0 || talentNodeGroup.column < 0) {
      return undefined;
    }

    // Only one node in this column can be selected (scopes, etc)
    const exclusiveInColumn = Boolean(talentNodeGroup.exclusiveWithNodeHashes &&
                              talentNodeGroup.exclusiveWithNodeHashes.length > 0);

    const activatedAtGridLevel = talentNodeSelected.activationRequirement.gridLevel;

    // There's a lot more here, but we're taking just what we need
    return {
      name: nodeName,
      hash: talentNodeSelected.nodeStepHash,
      description: talentNodeSelected.displayProperties.description,
      icon: talentNodeSelected.displayProperties.icon,
      // Position in the grid
      column: talentNodeGroup.column / 8,
      row: talentNodeGroup.row / 8,
      // Is the node selected (lit up in the grid)
      activated: true,
      // The item level at which this node can be unlocked
      activatedAtGridLevel,
      // Only one node in this column can be selected (scopes, etc)
      exclusiveInColumn,
      // Whether or not the material cost has been paid for the node
      unlocked: true,
      // Some nodes don't show up in the grid, like purchased ascend nodes
      hidden: false
    };
  })) as DimGridNode[];

  if (!gridNodes.length) {
    return null;
  }

  // Fix for stuff that has nothing in early columns
  const minByColumn = _.min(gridNodes.filter((n) => !n.hidden), (n) => n.column);
  const minColumn = minByColumn.column;
  if (minColumn > 0) {
    gridNodes.forEach((node) => { node.column -= minColumn; });
  }

  return {
    nodes: _.sortBy(gridNodes, (node) => node.column + (0.1 * node.row)),
    complete: _.all(gridNodes, (n) => n.unlocked)
  };
}

function buildSockets(
  item: DestinyItemComponent,
  socketsMap: { [key: string]: DestinyItemSocketsComponent },
  defs: D2ManifestDefinitions,
  itemDef: DestinyInventoryItemDefinition
): DimSockets | null {
  if (!item.itemInstanceId || !itemDef.sockets || !itemDef.sockets.socketEntries.length || !socketsMap[item.itemInstanceId]) {
    return null;
  }
  const sockets = socketsMap[item.itemInstanceId].sockets;
  if (!sockets || !sockets.length) {
    return null;
  }

  const realSockets = sockets.map((socket): DimSocket => {
    const plug = socket.plugHash ? defs.InventoryItem.get(socket.plugHash) : null;
    let failReasons = plug ? (socket.enableFailIndexes || []).map((index) => plug.plug.enabledRules[index].failureMessage).join("\n") : '';
    if (failReasons.length) {
      failReasons = `\n\n${failReasons}`;
    }
    const reusablePlugs = (socket.reusablePlugHashes || []).map((hash) => defs.InventoryItem.get(hash));
    // 1742617626 - armor ornaments
    // 3124752623 - weapon ornaments
    const isOrnamentPlug = plug && (plug.itemCategoryHashes.some((hash) => [1742617626, 3124752623].includes(hash)));
    const plugOptions = reusablePlugs.length > 0 && (!plug || !socket.plugHash || ((socket.reusablePlugHashes || []).includes(socket.plugHash) && !isOrnamentPlug)) ?
      reusablePlugs :
      (plug ? [plug] : []);
    // the merge is to enable the intrinsic mods to show up even if the user chose another
    // plug.itemCategoryHashes.includes(141186804) - removes the reusablePlugs from masterwork
    // plug.action - removes the "Remove Shader" plug
    if (reusablePlugs.length > 0 && plugOptions.length > 0) {
      reusablePlugs.forEach((plug) => {
        if (!plugOptions.includes(plug) && !plug.itemCategoryHashes.includes(141186804) && !isOrnamentPlug && plug.action) {
            plugOptions.push(plug);
          }
        });
    }
    const plugOptionsPerks = plugOptions.length > 0 ?
      (plugOptions.filter((plug) => plug.perks.length > 0) || []).map((plug) => defs.SandboxPerk.get(plug.perks[0].perkHash)) :
      [];
    const plugObjectives = (socket.plugObjectives && socket.plugObjectives.length) ? socket.plugObjectives : [];

    return {
      plug,
      reusablePlugs,
      enabled: socket.isEnabled,
      enableFailReasons: failReasons,
      plugOptions,
      plugOptionsPerks,
      plugObjectives
    };
  });

  const categories = itemDef.sockets.socketCategories.map((category): DimSocketCategory => {
    return {
      category: defs.SocketCategory.get(category.socketCategoryHash),
      sockets: category.socketIndexes.map((index) => realSockets[index])
    };
  });

  return {
    sockets: realSockets, // Flat list of sockets
    categories // Sockets organized by category
  };
}

function buildMasterworkInfo(
  sockets: DimSockets,
  defs: D2ManifestDefinitions
): DimMasterwork | null {
  const socket = sockets.sockets[sockets.sockets.findIndex((socket) => socket.plugObjectives.length > 0)];
  if (!socket || !socket.plugObjectives || !socket.plugObjectives.length || !socket.plugOptions || !socket.plugOptions.length) {
    return null;
  }
  const plugObjective = socket.plugObjectives[0];
  const plugOption = socket.plugOptions[0];
  if (!plugOption.investmentStats || !plugOption.investmentStats.length) {
    return null;
  }
  const statHash = plugOption.investmentStats[0].statTypeHash;

  const objectiveDef = defs.Objective.get(plugObjective.objectiveHash);
  const statDef = defs.Stat.get(statHash);

  if (!objectiveDef || !statDef) {
    return null;
  }

  return {
    progress: plugObjective.progress,
    typeName: (plugOption.plug.plugCategoryHash === 2109207426) ? "Vanguard" : "Crucible",
    typeIcon:  objectiveDef.displayProperties.icon,
    typeDesc: objectiveDef.progressDescription,
    statHash,
    statName: statDef.displayProperties.name,
    statValue: plugOption.investmentStats[0].value
  };
}

function getBasePowerLevel(item: DimItem): number {
  const MOD_CATEGORY = 59;
  const POWER_STAT_HASH = 1935470627;
  const powerMods = item.sockets ? _.pluck(item.sockets.sockets, 'plug').filter((plug) => {
    return plug && plug.itemCategoryHashes && plug.investmentStats &&
      plug.itemCategoryHashes.includes(MOD_CATEGORY) &&
      plug.investmentStats.some((s) => s.statTypeHash === POWER_STAT_HASH);
  }) : [];

  const modPower = sum(powerMods, (mod) => mod.investmentStats.find((s) => s.statTypeHash === POWER_STAT_HASH).value);

  return item.primStat ? (item.primStat.value - modPower) : 0;
}
