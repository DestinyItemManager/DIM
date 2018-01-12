import { BucketsService, DimInventoryBuckets, DimInventoryBucket } from './../../destiny2/d2-buckets.service';
import { LazyDefinition, D2ManifestDefinitions, D2DefinitionsService } from './../../destiny2/d2-definitions.service';
import { DestinyItemComponent, DestinyItemComponentSetOfint64, DestinyInventoryComponent, DestinyItemInstanceComponent, ItemLocation, DestinyItemStatsComponent, DestinyStatDefinition, DestinyStat, DestinyItemInvestmentStatDefinition, DestinyClass, DestinyInventoryItemDefinition, DestinyClassDefinition, DestinyInventoryItemStatDefinition, DestinyItemQualityBlockDefinition, DestinyItemTierTypeInfusionBlock, DestinyItemObjectivesComponent, DestinyObjectiveDefinition, DestinyTalentGridDefinition, DestinyItemTalentGridComponent } from 'bungie-api-ts/destiny2';
import { IPromise, extend } from 'angular';
import * as _ from 'underscore';
import { getClass } from './character-utils';
import { sum } from '../../util';
import { DimStore } from '../d2-stores.service';

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

interface EnhancedStat extends DestinyStat {
  stat: DestinyStatDefinition & { statName: string };
}

interface DimStat {
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

interface DimObjective {
  displayName: string;
  description: string;
  progress: number;
  completionValue: number;
  complete: boolean;
  boolean: boolean;
  display: string;
}

interface DimGridNode {
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

interface DimTalentGrid {
  nodes: DimGridNode[];
  complete: boolean;
}

export interface DimItem {
  owner: string;
  /** The version of Destiny this comes from */
  destinyVersion: 1 | 2;
  // The bucket the item is currently in
  location: DimInventoryBucket;
  // The bucket the item normally resides in (even though it may be in the vault/postmaster)
  bucket: DimInventoryBucket;
  hash: number;
  // This is the type of the item (see D2Category/D2Buckets) regardless of location
  type: string;
  categories; // see defs.ItemCategories
  tier: string;
  isExotic: boolean;
  isVendorItem: boolean;
  name: string;
  description: string;
  icon: string;
  notransfer: boolean;
  id: string; // zero for non-instanced is legacy hack
  equipped: boolean;
  equipment: boolean; // TODO: this has a ton of good info for the item move logic
  complete: boolean; // TODO: what's the deal w/ item progression?
  amount: number;
  primStat: EnhancedStat | null;
  typeName: string;
  equipRequiredLevel: number;
  maxStackSize: number;
  // 0: titan, 1: hunter, 2: warlock, 3: any
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
  sockets?;
  percentComplete: number;
  talentGrid?: DimTalentGrid | null;
  stats: DimStat[] | null;
  objectives: DimObjective[] | null;
  quality;
  taggable: boolean;
  comparable: boolean;
  reviewable: boolean;
  isNew: boolean;
  dimInfo?;
  perks?;
  basePower: number;
  index: string;
  infusionProcess: DestinyItemTierTypeInfusionBlock | null;
  infusable: boolean;
  infusionQuality: DestinyItemQualityBlockDefinition | null;
  // Can this item be equipped by the given store?
  canBeEquippedBy(store: DimStore): boolean;
  inCategory(categoryName: string): boolean;
  isEngram(): boolean;
  canBeInLoadout(): boolean;
  hasLifeExotic(): boolean;
}

export interface D2ItemFactoryType {
  resetIdTracker(): void;
  processItems(
    owner: DimStore,
    items: DestinyItemComponent[],
    itemComponents: DestinyItemComponentSetOfint64,
    previousItems: Set<string>,
    newItems: Set<string>,
    itemInfoService
  ): IPromise<DimItem[]>;
  makeItem(
    defs: D2ManifestDefinitions,
    buckets: DimInventoryBuckets,
    previousItems: Set<string>,
    newItems: Set<string>,
    itemInfoService,
    itemComponents: DestinyItemComponentSetOfint64,
    item: DestinyItemComponent,
    owner: DimStore
  ): DimItem | null;
  createItemIndex(item: DimItem): string;
}

/**
 * A factory service for producing DIM inventory items.
 */
export function D2ItemFactory(
  D2ManifestService,
  dimSettingsService,
  $i18next,
  NewItemsService,
  D2Definitions: D2DefinitionsService,
  D2BucketsService: BucketsService,
  $q
): D2ItemFactoryType {
  'ngInject';

  let _idTracker = {};

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
    // These two types are missing.
    // ???: 'CATEGORY_GRENADE_LAUNCHER',
    // ???: 'CATEGORY_SUBMACHINEGUN',
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
      return _.contains(this.categories, categoryName);
    },
    isEngram() {
      return false;
    },
    canBeInLoadout() {
      return this.equipment || this.type === 'Material' || this.type === 'Consumable';
    },
    hasLifeExotic() {
      return (this.type === 'Ghost' || this.type === 'Vehicle' || this.type === 'Ships' || this.type === 'Emotes') && this.isExotic;
    }
  };

  return {
    resetIdTracker,
    processItems,
    makeItem,
    createItemIndex
  };

  function resetIdTracker() {
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
  function processItems(
    owner: DimStore,
    items: DestinyItemComponent[],
    itemComponents: DestinyItemComponentSetOfint64,
    previousItems: Set<string> = new Set(),
    newItems: Set<string> = new Set(),
    itemInfoService): IPromise<DimItem[]> {
    return $q.all([
      D2Definitions.getDefinitions(),
      D2BucketsService.getBuckets()])
      .then(([defs, buckets]: [D2ManifestDefinitions, any]) => {
        const result: DimItem[] = [];
        D2ManifestService.statusText = `${$i18next.t('Manifest.LoadCharInv')}...`;
        _.each(items, (item) => {
          let createdItem: DimItem | null = null;
          try {
            createdItem = makeItem(defs, buckets, previousItems, newItems, itemInfoService, itemComponents, item, owner);
          } catch (e) {
            console.error("Error processing item", item, e);
          }
          if (createdItem !== null) {
            createdItem.owner = owner.id;
            result.push(createdItem);
          }
        });
        return result;
      });
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
   * Process a single raw item into a DIM item.s
   * @param defs the manifest definitions from dimDefinitions
   * @param buckets the bucket definitions from dimBucketService
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
    itemInfoService,
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
      notransfer: Boolean(currentBucket.inPostmaster || itemDef.nonTransferrable),
      id: item.itemInstanceId || '0', // zero for non-instanced is legacy hack
      equipped: Boolean(instanceDef.isEquipped),
      equipment: Boolean(itemDef.equippingBlock), // TODO: this has a ton of good info for the item move logic
      complete: false, // TODO: what's the deal w/ item progression?
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
      isInLoadout: false,
      percentComplete: null, // filled in later
      talentGrid: null, // filled in later
      stats: null, // filled in later
      objectives: null, // filled in later
      quality: null // filled in later
    });

    // *able
    createdItem.taggable = Boolean($featureFlags.tagsEnabled && (createdItem.lockable || createdItem.classified));
    createdItem.comparable = Boolean($featureFlags.compareEnabled && createdItem.equipment && createdItem.lockable);
    createdItem.reviewable = Boolean($featureFlags.reviewsEnabled && isWeaponOrArmor(createdItem));

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
          buildHiddenStats(item, itemDef, defs.Stat)
        ), 'sort');
      }
      if (!createdItem.stats && itemDef.investmentStats && itemDef.investmentStats.length) {
        createdItem.stats = _.sortBy(buildInvestmentStats(item, itemDef.investmentStats, defs.Stat));
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
      createdItem.sockets = buildSockets(item, itemComponents.sockets.data, defs, itemDef);
    } catch (e) {
      console.error(`Error building sockets for ${createdItem.name}`, item, itemDef, e);
    }

    if (itemDef.perks && itemDef.perks.length) {
      createdItem.perks = itemDef.perks.map((p) => {
        return { requirement: p.requirementDisplayString, ...defs.SandboxPerk.get(p.perkHash) };
      }).filter((p) => p.isDisplayable);
      if (createdItem.perks.length === 0) {
        createdItem.perks = null;
      }
    }

    if (createdItem.objectives) {
      createdItem.complete = (!createdItem.talentGrid || createdItem.complete) && _.all(createdItem.objectives, (o) => o.complete);
      const length = createdItem.objectives.length;
      createdItem.percentComplete = sum(createdItem.objectives, (objective) => {
        if (objective.completionValue) {
          return Math.min(1, objective.progress / objective.completionValue) / length;
        } else {
          return 0;
        }
      });
    }

    // Infusion
    const tier = itemDef.inventory ? defs.ItemTierType[itemDef.inventory.tierTypeHash] : null;
    createdItem.infusionProcess = tier && tier.infusionProcess;
    createdItem.infusable = Boolean(createdItem.infusionProcess && itemDef.quality && itemDef.quality.infusionCategoryHashes && itemDef.quality.infusionCategoryHashes.length);
    createdItem.infusionQuality = itemDef.quality || null;

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

  // Set an ID for the item that should be unique across all items
  function createItemIndex(item: DimItem): string {
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
    if (item.quality) {
      index += `-q${item.quality.min}`;
    }
    if (item.primStat && item.primStat.value) {
      index += `-ps${item.primStat.value}`;
    }

    return index;
  }

  function getClassTypeNameLocalized(defs: D2ManifestDefinitions, type: DestinyClass) {
    const klass = _.find(Object.values(defs.Class), { classType: type });
    if (klass) {
      return klass.displayProperties.name;
    } else {
      return $i18next.t('Loadouts.Any');
    }
  }

  function buildHiddenStats(item: DestinyItemComponent, itemDef: DestinyInventoryItemDefinition, statDefs: LazyDefinition<DestinyStatDefinition>): DimStat[] {
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
    item: DestinyItemComponent,
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

    // TODO: there is also 'flavorObjectives' for things like emblem stats
    const objectives = objectivesMap[item.itemInstanceId].objectives;
    if (!objectives || !objectives.length) {
      return null;
    }

    // TODO: we could make a tooltip with the location + activities for each objective (and maybe offer a ghost?)

    return objectives.map((objective) => {
      const def = objectiveDefs.get(objective.objectiveHash);

      return {
        displayName: def.displayProperties.name ||
          (objective.complete
            ? $i18next.t('Objectives.Complete')
            : $i18next.t('Objectives.Incomplete')),
        description: def.displayProperties.description,
        progress: objective.progress || 0,
        completionValue: def.completionValue,
        complete: objective.complete,
        boolean: def.completionValue === 1,
        display: `${objective.progress || 0}/${def.completionValue}`
      };
    });
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

    const gridNodes = _.compact(talentGridDef.nodes.map((node) => {
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
      const gridNode: DimGridNode = {
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
      return gridNode;
    })) as DimGridNode[];

    if (!gridNodes.length) {
      return null;
    }

    // Fix for stuff that has nothing in early columns
    const minByColumn = _.min(gridNodes.filter((n) => !n.hidden, (n) => n.column);
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
    itemDef: DestinyInventoryItemDefinition) {
    if (!item.itemInstanceId || !itemDef.sockets || !itemDef.sockets.socketEntries.length) {
      return null;
    }
    let soc kets = socketsMap[item.itemInstanceId];
    if (sockets) {
      sockets = socketsMap[item.itemInstanceId].sockets;
    }
    if (!sockets || !sockets.length) {
      return null;
    }

    const realSockets = sockets.map((socket) => {
      const plug = defs.InventoryItem.get(socket.plugHash);
      let failReasons = (socket.enableFailIndexes || []).map((index) => plug.plug.enabledRules[index].failureMessage).join("\n");
      if (failReasons.length) {
        failReasons = `\n\n${failReasons}`;
      }
      const dimSocket = {
        plug,
        reusablePlugs: (socket.reusablePlugHashes || []).map((hash) => defs.InventoryItem.get(hash)),
        enabled: socket.isEnabled,
        enableFailReasons: failReasons
      };
      dimSocket.plugOptions = dimSocket.reusablePlugs.length > 0 && (!plug || (socket.reusablePlugHashes || []).includes(socket.plugHash)) ? dimSocket.reusablePlugs : [dimSocket.plug];
      dimSocket.masterworkProgress = (socket.plugObjectives && socket.plugObjectives.length) ? socket.plugObjectives[0].progress : undefined;

      return dimSocket;
    });

    const categories = itemDef.sockets.socketCategories.map((category) => {
      return {
        category: defs.SocketCategory.get(category.socketCategoryHash),
        sockets: category.socketIndexes.map((index) => realSockets[index])
      };
    });

    const dimSockets = {
      sockets: realSockets, // Flat list of sockets
      categories // Sockets organized by category
    };

    return dimSockets;
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
}
