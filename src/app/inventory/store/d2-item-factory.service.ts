import {
  DestinyClass,
  DestinyInventoryItemDefinition,
  DestinyInventoryItemStatDefinition,
  DestinyItemComponent,
  DestinyItemComponentSetOfint64,
  DestinyItemInstanceComponent,
  DestinyItemInvestmentStatDefinition,
  DestinyItemObjectivesComponent,
  DestinyItemSocketsComponent,
  DestinyItemStatsComponent,
  DestinyItemTalentGridComponent,
  DestinyObjectiveDefinition,
  DestinyStat,
  DestinyStatDefinition,
  DestinyTalentGridDefinition,
  ItemLocation,
  TransferStatuses,
  DestinyUnlockValueUIStyle,
  DestinyItemSocketState,
  DestinyItemPlug,
  DestinyItemSocketEntryDefinition,
  DestinyItemSocketEntryPlugItemDefinition,
  DestinyAmmunitionType,
  DamageType,
  ItemState
} from 'bungie-api-ts/destiny2';
import * as _ from 'lodash';
import { getBuckets } from '../../destiny2/d2-buckets.service';
import {
  getDefinitions,
  D2ManifestDefinitions,
  LazyDefinition
} from '../../destiny2/d2-definitions.service';
import { reportException } from '../../exceptions';

import { D2ManifestService } from '../../manifest/manifest-service-json';
import { getClass } from './character-utils';
import { NewItemsService } from './new-items.service';
import { ItemInfoSource } from '../dim-item-info';
import { t } from 'i18next';
import {
  D2Item,
  DimPerk,
  DimStat,
  DimObjective,
  DimFlavorObjective,
  DimTalentGrid,
  DimGridNode,
  DimSockets,
  DimSocketCategory,
  DimSocket,
  DimPlug,
  DimMasterwork
} from '../item-types';
import { D2Store } from '../store-types';
import { InventoryBuckets } from '../inventory-buckets';
import { D2RatingData } from '../../item-review/d2-dtr-api-types';
import { D2StoresService } from '../d2-stores.service';
import { filterPlugs } from '../../d2-loadout-builder/generated-sets/utils';
import { D2CurrentSeason } from './../d2-season-info';
import { D2SourcesToEvent } from './../d2-event-info';
import D2Seasons from 'app/data/d2-seasons.json';
import D2Events from 'app/data/d2-events.json';

// Maps tierType to tierTypeName in English
const tiers = ['Unknown', 'Currency', 'Common', 'Uncommon', 'Rare', 'Legendary', 'Exotic'];

/**
 * A factory service for producing DIM inventory items.
 */

let _idTracker: { [id: string]: number } = {};
// A map from instance id to the last time it was manually moved this session
const _moveTouchTimestamps = new Map<string, number>();

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
  1943323491, // Recovery
  447667954, // Draw Time
  1931675084 // Inventory Size
  //    1935470627, // Power
  // there are a few others (even an `undefined` stat)
];

const statsNoBar = [4284893193, 3871231066, 2961396640, 447667954, 1931675084];

const resistanceMods = {
  1546607977: DamageType.Kinetic,
  1546607980: DamageType.Void,
  1546607978: DamageType.Arc,
  1546607979: DamageType.Thermal
};

const collectiblesByItemHash = _.once((Collectible) => {
  return _.keyBy(Collectible.getAll(), 'itemHash');
});

// Prototype for Item objects - add methods to this to add them to all
// items.
const ItemProto = {
  // Can this item be equipped by the given store?
  canBeEquippedBy(this: D2Item, store: D2Store) {
    if (store.isVault) {
      return false;
    }

    return (
      this.equipment &&
      // For the right class
      (this.classTypeName === 'unknown' || this.classTypeName === store.class) &&
      // nothing we are too low-level to equip
      this.equipRequiredLevel <= store.level &&
      // can be moved or is already here
      (!this.notransfer || this.owner === store.id) &&
      !this.location.inPostmaster
    );
  },
  canBeInLoadout(this: D2Item) {
    return this.equipment || this.type === 'Consumables';
  },
  // Mark that this item has been moved manually
  updateManualMoveTimestamp(this: D2Item) {
    this.lastManuallyMoved = Date.now();
    if (this.id !== '0') {
      _moveTouchTimestamps.set(this.id, this.lastManuallyMoved);
    }
  },
  isDestiny1(this: D2Item) {
    return false;
  },
  isDestiny2(this: D2Item) {
    return true;
  },
  getStoresService() {
    return D2StoresService;
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
  owner: D2Store,
  items: DestinyItemComponent[],
  itemComponents: DestinyItemComponentSetOfint64,
  previousItems: Set<string> = new Set(),
  newItems: Set<string> = new Set(),
  itemInfoService: ItemInfoSource
): Promise<D2Item[]> {
  return Promise.all([getDefinitions(), getBuckets()]).then(([defs, buckets]) => {
    const result: D2Item[] = [];
    D2ManifestService.statusText = `${t('Manifest.LoadCharInv')}...`;
    _.each(items, (item) => {
      let createdItem: D2Item | null = null;
      try {
        createdItem = makeItem(
          defs,
          buckets,
          previousItems,
          newItems,
          itemInfoService,
          itemComponents,
          item,
          owner
        );
      } catch (e) {
        console.error('Error processing item', item, e);
        reportException('Processing Dim item', e);
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
export function createItemIndex(item: D2Item): string {
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
 * Process a single raw item into a DIM item.
 * @param defs the manifest definitions
 * @param buckets the bucket definitions
 * @param previousItems a set of item IDs representing the previous store's items
 * @param newItems a set of item IDs representing the previous list of new items
 * @param itemInfoService the item info factory for this store's platform
 * @param item "raw" item from the Destiny API
 * @param owner the ID of the owning store.
 */
// TODO: extract item components first!
export function makeItem(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  previousItems: Set<string>,
  newItems: Set<string>,
  itemInfoService: ItemInfoSource | undefined,
  itemComponents: DestinyItemComponentSetOfint64 | undefined,
  item: DestinyItemComponent,
  owner: D2Store | undefined,
  reviewData?: D2RatingData | null
): D2Item | null {
  const itemDef = defs.InventoryItem.get(item.itemHash);
  const instanceDef: Partial<DestinyItemInstanceComponent> =
    item.itemInstanceId && itemComponents ? itemComponents.instances.data[item.itemInstanceId] : {};
  // Missing definition?
  if (!itemDef) {
    D2ManifestService.warnMissingDefinition();
    return null;
  }

  if (itemDef.redacted) {
    console.warn(
      'Missing Item Definition:\n\n',
      { item, itemDef, instanceDef },
      '\n\nThis item is not in the current manifest and will be added at a later time by Bungie.'
    );
  }

  if (!itemDef || !itemDef.displayProperties.name) {
    return null;
  }

  let displayProperties = itemDef.displayProperties;
  if (itemDef.redacted) {
    // Fill in display info from the collectible, sometimes it's not redacted there!
    const collectibleDef = collectiblesByItemHash(defs.Collectible)[item.itemHash];
    if (collectibleDef) {
      displayProperties = collectibleDef.displayProperties;
    }
  }

  // def.bucketTypeHash is where it goes normally
  let normalBucket = buckets.byHash[itemDef.inventory.bucketTypeHash];

  // https://github.com/Bungie-net/api/issues/687
  if (itemDef.inventory.bucketTypeHash === 2422292810) {
    normalBucket = buckets.byHash[3313201758];
  }

  // item.bucket is where it IS right now
  let currentBucket = buckets.byHash[item.bucketHash] || normalBucket;
  if (!normalBucket) {
    currentBucket = normalBucket = buckets.unknown;
    buckets.setHasUnknown();
  }

  // We cheat a bit for items in the vault, since we treat the
  // vault as a character. So put them in the bucket they would
  // have been in if they'd been on a character.
  if ((owner && owner.isVault) || item.location === ItemLocation.Vault) {
    currentBucket = normalBucket;
  }

  const itemType = normalBucket.type || 'Unknown';

  const dmgName = instanceDef
    ? [null, 'kinetic', 'arc', 'solar', 'void', 'raid'][instanceDef.damageType || 0]
    : null;

  // https://github.com/Bungie-net/api/issues/134, class items had a primary stat
  const primaryStat =
    (itemDef.stats && itemDef.stats.disablePrimaryStatDisplay) || itemType === 'Class'
      ? null
      : (instanceDef && instanceDef.primaryStat) || null;

  const createdItem: D2Item = Object.assign(Object.create(ItemProto), {
    // figure out what year this item is probably from
    destinyVersion: 2,
    // The bucket the item is currently in
    location: currentBucket,
    // The bucket the item normally resides in (even though it may be in the vault/postmaster)
    bucket: normalBucket,
    hash: item.itemHash,
    // This is the type of the item (see DimCategory/DimBuckets) regardless of location
    type: itemType,
    itemCategoryHashes: itemDef.itemCategoryHashes || [], // see defs.ItemCategory
    tier: tiers[itemDef.inventory.tierType] || 'Common',
    isExotic: tiers[itemDef.inventory.tierType] === 'Exotic',
    isVendorItem: !owner || owner.id === null,
    name: displayProperties.name,
    description: displayProperties.description,
    icon: displayProperties.icon || '/img/misc/missing_icon_d2.png',
    secondaryIcon: itemDef.secondaryIcon || '/img/misc/missing_icon_d2.png',
    notransfer: Boolean(
      itemDef.nonTransferrable || item.transferStatus === TransferStatuses.NotTransferrable
    ),
    canPullFromPostmaster: !itemDef.doesPostmasterPullHaveSideEffects,
    id: item.itemInstanceId || '0', // zero for non-instanced is legacy hack
    equipped: Boolean(instanceDef && instanceDef.isEquipped),
    equipment: Boolean(itemDef.equippingBlock), // TODO: this has a ton of good info for the item move logic
    equippingLabel: itemDef.equippingBlock && itemDef.equippingBlock.uniqueLabel,
    complete: false,
    amount: item.quantity,
    primStat: primaryStat,
    typeName: itemDef.itemTypeDisplayName || 'Unknown',
    equipRequiredLevel: (instanceDef && instanceDef.equipRequiredLevel) || 0,
    maxStackSize: Math.max(itemDef.inventory.maxStackSize, 1),
    uniqueStack:
      itemDef.inventory.stackUniqueLabel && itemDef.inventory.stackUniqueLabel.length > 0,
    // 0: titan, 1: hunter, 2: warlock, 3: any
    classType: itemDef.classType,
    classTypeName: itemDef.redacted ? 'unknown' : getClass(itemDef.classType),
    classTypeNameLocalized: getClassTypeNameLocalized(defs, itemDef.classType),
    dmg: dmgName,
    visible: true,
    lockable: item.lockable,
    tracked: Boolean(item.state & ItemState.Tracked),
    locked: Boolean(item.state & ItemState.Locked),
    masterwork: Boolean(item.state & ItemState.Masterwork),
    classified: Boolean(itemDef.redacted),
    isEngram: itemDef.itemCategoryHashes ? itemDef.itemCategoryHashes.includes(34) : false, // category hash for engrams
    loreHash: itemDef.loreHash,
    lastManuallyMoved: item.itemInstanceId ? _moveTouchTimestamps.get(item.itemInstanceId) || 0 : 0,
    percentComplete: 0, // filled in later
    hidePercentage: false,
    talentGrid: null, // filled in later
    stats: null, // filled in later
    objectives: null, // filled in later
    dtrRating: null,
    previewVendor: itemDef.preview && itemDef.preview.previewVendorHash,
    ammoType: itemDef.equippingBlock ? itemDef.equippingBlock.ammoType : DestinyAmmunitionType.None,
    season: D2Seasons[item.itemHash] || D2CurrentSeason,
    source: itemDef.collectibleHash
      ? defs.Collectible.get(itemDef.collectibleHash).sourceHash
      : null,
    missingSockets: false
  });

  createdItem.event = createdItem.source
    ? D2SourcesToEvent[String(createdItem.source)] || D2Events[item.itemHash]
    : D2Events[item.itemHash];

  // *able
  createdItem.taggable = Boolean(createdItem.lockable || createdItem.classified);
  createdItem.comparable = Boolean(createdItem.equipment && createdItem.lockable);
  createdItem.reviewable = Boolean(
    ($featureFlags.reviewsEnabled && isWeaponOrArmor(createdItem)) ||
      (reviewData && reviewData.reviewsResponse && reviewData.reviewsResponse.reviews)
  );

  if (createdItem.primStat) {
    const statDef = defs.Stat.get(createdItem.primStat.statHash);
    // TODO: hey, does this work?
    createdItem.primStat.stat = Object.create(statDef);
    createdItem.primStat.stat.statName = statDef.displayProperties.name;
  }

  // An item is new if it was previously known to be new, or if it's new since the last load (previousItems);
  try {
    NewItemsService.isItemNew(createdItem.id, previousItems, newItems);
  } catch (e) {
    console.error(`Error determining new-ness of ${createdItem.name}`, item, itemDef, e);
    reportException('Newness', e, { itemHash: item.itemHash });
  }

  if (itemInfoService) {
    try {
      createdItem.dimInfo = itemInfoService.infoForItem(createdItem.hash, createdItem.id);
    } catch (e) {
      console.error(`Error getting extra DIM info for ${createdItem.name}`, item, itemDef, e);
      reportException('DimInfo', e, { itemHash: item.itemHash });
    }
  }

  try {
    // TODO: move socket handling and stuff into a different file
    if (itemComponents && itemComponents.sockets && itemComponents.sockets.data) {
      createdItem.sockets = buildSockets(item, itemComponents.sockets.data, defs, itemDef);
    }
    if (!createdItem.sockets && itemDef.sockets) {
      if (
        itemComponents &&
        itemComponents.sockets &&
        itemComponents.sockets.data &&
        item.itemInstanceId &&
        !itemComponents.sockets.data[item.itemInstanceId]
      ) {
        createdItem.missingSockets = true;
      }
      createdItem.sockets = buildDefinedSockets(defs, itemDef);
    }
  } catch (e) {
    console.error(`Error building sockets for ${createdItem.name}`, item, itemDef, e);
    reportException('Sockets', e, { itemHash: item.itemHash });
  }

  try {
    if (itemComponents && itemComponents.stats && itemComponents.stats.data) {
      // Instanced stats
      createdItem.stats = buildStats(
        item,
        createdItem.sockets,
        itemComponents.stats.data,
        defs.Stat
      );
      if (itemDef.stats && itemDef.stats.stats) {
        // Hidden stats
        createdItem.stats = (createdItem.stats || []).concat(buildHiddenStats(itemDef, defs.Stat));
      }
    } else if (itemDef.stats && itemDef.stats.stats) {
      // Item definition stats
      createdItem.stats = buildDefaultStats(itemDef, defs.Stat);
    }
    // Investment stats
    if (!createdItem.stats && itemDef.investmentStats && itemDef.investmentStats.length) {
      createdItem.stats = _.sortBy(buildInvestmentStats(itemDef.investmentStats, defs.Stat));
    }

    createdItem.stats = createdItem.stats && _.sortBy(createdItem.stats, (s) => s.sort);
  } catch (e) {
    console.error(`Error building stats for ${createdItem.name}`, item, itemDef, e);
    reportException('Stats', e, { itemHash: item.itemHash });
  }

  try {
    if (itemComponents && itemComponents.talentGrids && itemComponents.talentGrids.data) {
      createdItem.talentGrid = buildTalentGrid(
        item,
        itemComponents.talentGrids.data,
        defs.TalentGrid
      );
    }
  } catch (e) {
    console.error(`Error building talent grid for ${createdItem.name}`, item, itemDef, e);
    reportException('TalentGrid', e, { itemHash: item.itemHash });
  }

  try {
    if (itemComponents && itemComponents.objectives && itemComponents.objectives.data) {
      createdItem.objectives = buildObjectives(
        item,
        itemComponents.objectives.data,
        defs.Objective
      );
    }
  } catch (e) {
    console.error(`Error building objectives for ${createdItem.name}`, item, itemDef, e);
    reportException('Objectives', e, { itemHash: item.itemHash });
  }

  try {
    if (itemComponents && itemComponents.objectives && itemComponents.objectives.data) {
      createdItem.flavorObjective = buildFlavorObjective(
        item,
        itemComponents.objectives.data,
        defs.Objective
      );
    }
  } catch (e) {
    console.error(`Error building flavor objectives for ${createdItem.name}`, item, itemDef, e);
    reportException('FlavorObjectives', e, { itemHash: item.itemHash });
  }

  // TODO: Are these ever defined??
  if (itemDef.perks && itemDef.perks.length) {
    createdItem.perks = itemDef.perks
      .map(
        (p): DimPerk => {
          return { requirement: p.requirementDisplayString, ...defs.SandboxPerk.get(p.perkHash) };
        }
      )
      .filter((p) => p.isDisplayable);
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
      createdItem.percentComplete = _.sumBy(createdItem.objectives, (objective) => {
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

  // Secondary Icon
  if (createdItem.sockets) {
    const multiEmblem = createdItem.sockets.sockets.filter(
      (plug) => plug.plug && plug.plug.plugItem.itemType === 14
    );
    const selectedEmblem = multiEmblem[0] && multiEmblem[0].plug;

    if (selectedEmblem) {
      createdItem.secondaryIcon = selectedEmblem.plugItem.secondaryIcon;
    }
  }

  // Infusion
  const tier = itemDef.inventory ? defs.ItemTierType[itemDef.inventory.tierTypeHash] : null;
  createdItem.infusionProcess = tier && tier.infusionProcess;
  createdItem.infusionFuel = Boolean(
    createdItem.infusionProcess &&
      itemDef.quality &&
      itemDef.quality.infusionCategoryHashes &&
      itemDef.quality.infusionCategoryHashes.length
  );
  createdItem.infusable = createdItem.infusionFuel && isLegendaryOrBetter(createdItem);
  createdItem.infusionQuality = itemDef.quality || null;

  // Masterwork
  if (createdItem.masterwork && createdItem.sockets) {
    try {
      createdItem.masterworkInfo = buildMasterworkInfo(createdItem.sockets, defs);
    } catch (e) {
      console.error(`Error building masterwork info for ${createdItem.name}`, item, itemDef, e);
      reportException('MasterworkInfo', e, { itemHash: item.itemHash });
    }
  }

  // Forsaken Masterwork
  if (createdItem.sockets && !createdItem.masterworkInfo) {
    try {
      buildForsakenMasterworkInfo(createdItem, defs);
    } catch (e) {
      console.error(
        `Error building Forsaken masterwork info for ${createdItem.name}`,
        item,
        itemDef,
        e
      );
      reportException('ForsakenMasterwork', e, { itemHash: item.itemHash });
    }
  }

  // TODO: Phase out "base power"
  if (createdItem.primStat) {
    createdItem.basePower = getBasePowerLevel(createdItem);
  }

  // Mark masterworks with a gold border
  if (createdItem.masterwork) {
    createdItem.complete = true;
  }

  createdItem.index = createItemIndex(createdItem);

  return createdItem;
}

function isWeaponOrArmor(item: D2Item) {
  return (
    item.primStat &&
    (item.primStat.statHash === 1480404414 || // weapon
      item.primStat.statHash === 3897883278)
  ); // armor
}

function isLegendaryOrBetter(item) {
  return item.tier === 'Legendary' || item.tier === 'Exotic';
}

function getClassTypeNameLocalized(defs: D2ManifestDefinitions, type: DestinyClass) {
  const klass = Object.values(defs.Class).find((c) => c.classType === type);
  if (klass) {
    return klass.displayProperties.name;
  } else {
    return t('Loadouts.Any');
  }
}

function buildHiddenStats(
  itemDef: DestinyInventoryItemDefinition,
  statDefs: LazyDefinition<DestinyStatDefinition>
): DimStat[] {
  const itemStats = itemDef.stats.stats;

  if (!itemStats) {
    return [];
  }

  return _.compact(
    _.map(
      itemStats,
      (stat: DestinyInventoryItemStatDefinition): DimStat | undefined => {
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
      }
    )
  );
}

function buildDefaultStats(
  itemDef: DestinyInventoryItemDefinition,
  statDefs: LazyDefinition<DestinyStatDefinition>
): DimStat[] {
  const itemStats = itemDef.stats.stats;

  if (!itemStats) {
    return [];
  }

  return _.compact(
    _.map(
      itemStats,
      (stat: DestinyInventoryItemStatDefinition): DimStat | undefined => {
        const def = statDefs.get(stat.statHash);

        if (!statWhiteList.includes(stat.statHash) || !stat.value) {
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
          // Armor stats max out at 5, all others are... probably 100? See https://github.com/Bungie-net/api/issues/448
          maximumValue: [1943323491, 392767087, 2996146975].includes(stat.statHash) ? 5 : 100,
          bar: !statsNoBar.includes(stat.statHash)
        };
      }
    )
  );
}

function buildStats(
  item: DestinyItemComponent,
  sockets: DimSockets | null,
  stats: { [key: string]: DestinyItemStatsComponent },
  statDefs: LazyDefinition<DestinyStatDefinition>
): DimStat[] {
  if (!item.itemInstanceId || !stats[item.itemInstanceId]) {
    return [];
  }
  const itemStats = stats[item.itemInstanceId].stats;

  // determine bonuses for armor
  const statBonuses = {};
  if (sockets) {
    const bonusPerk = sockets.sockets.find((socket) =>
      Boolean(
        // Mobility, Restorative, and Resilience perk
        socket.plug && socket.plug.plugItem.plug.plugCategoryHash === 3313201758
      )
    );
    // If we didn't find one, then it's not armor.
    if (bonusPerk) {
      statBonuses[bonusPerk.plug!.plugItem.investmentStats[0].statTypeHash] = {
        plugs: bonusPerk.plug!.plugItem.investmentStats[0].value,
        perks: 0,
        mods: 0
      };

      // Custom applied mods
      sockets.sockets
        .filter((socket) =>
          Boolean(
            socket.plug &&
              socket.plug.plugItem.plug.plugCategoryHash === 3347429529 &&
              socket.plug.plugItem.inventory.tierType !== 2
          )
        )
        .forEach((socket) => {
          const bonusPerkStat = socket!.plug!.plugItem.investmentStats[0];
          if (bonusPerkStat) {
            if (!statBonuses[bonusPerkStat.statTypeHash]) {
              statBonuses[bonusPerkStat.statTypeHash] = { mods: 0 };
            }
            statBonuses[bonusPerkStat.statTypeHash].mods += bonusPerkStat.value;
          }
        });

      // Look for perks that modify stats (ie. Traction 1818103563)
      sockets.sockets
        .filter(filterPlugs)
        .filter((socket) =>
          Boolean(
            socket.plug &&
              socket.plug.plugItem.plug.plugCategoryHash !== 3347429529 &&
              socket.plug.plugItem.investmentStats &&
              socket.plug.plugItem.investmentStats.length
          )
        )
        .forEach((socket) => {
          const bonusPerkStat = socket!.plug!.plugItem.investmentStats[0];
          if (bonusPerkStat) {
            if (!statBonuses[bonusPerkStat.statTypeHash]) {
              statBonuses[bonusPerkStat.statTypeHash] = { perks: 0 };
            }
            statBonuses[bonusPerkStat.statTypeHash].perks += bonusPerkStat.value;
          }
        });
    }
  }

  return _.compact(
    _.map(
      itemStats,
      (stat: DestinyStat): DimStat | undefined => {
        const def = statDefs.get(stat.statHash);
        const itemStat = itemStats[stat.statHash];
        if (!def || !itemStat) {
          return undefined;
        }

        const value = itemStat ? itemStat.value : stat.value;
        let base = value;
        let bonus = 0;
        let plugBonus = 0;
        let modsBonus = 0;
        let perkBonus = 0;
        if (statBonuses[stat.statHash]) {
          plugBonus = statBonuses[stat.statHash].plugs || 0;
          modsBonus = statBonuses[stat.statHash].mods || 0;
          perkBonus = statBonuses[stat.statHash].perks || 0;
          bonus = plugBonus + perkBonus + modsBonus;
          base -= bonus;
        }

        return {
          base,
          bonus,
          plugBonus,
          modsBonus,
          perkBonus,
          statHash: stat.statHash,
          name: def.displayProperties.name,
          id: stat.statHash,
          sort: statWhiteList.indexOf(stat.statHash),
          value,
          maximumValue: itemStat.maximumValue,
          bar: !statsNoBar.includes(stat.statHash)
        };
      }
    )
  );
}

function buildInvestmentStats(
  itemStats: DestinyItemInvestmentStatDefinition[],
  statDefs: LazyDefinition<DestinyStatDefinition>
): DimStat[] {
  return _.compact(
    _.map(
      itemStats,
      (itemStat): DimStat | undefined => {
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
          bar: !statsNoBar.includes(itemStat.statTypeHash)
        };
      }
    )
  );
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

  return objectives
    .filter((o) => o.visible)
    .map((objective) => {
      const def = objectiveDefs.get(objective.objectiveHash);

      let complete = false;
      let booleanValue = false;
      let display = `${objective.progress || 0}/${objective.completionValue}`;
      let displayStyle: string | null;
      switch (def.valueStyle) {
        case DestinyUnlockValueUIStyle.Integer:
          display = `${objective.progress || 0}`;
          displayStyle = 'integer';
          break;
        case DestinyUnlockValueUIStyle.Multiplier:
          display = `${(objective.progress || 0) / objective.completionValue}x`;
          displayStyle = 'integer';
          break;
        case DestinyUnlockValueUIStyle.DateTime:
          const date = new Date(0);
          date.setUTCSeconds(objective.progress || 0);
          display = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
          displayStyle = 'integer';
          break;
        case DestinyUnlockValueUIStyle.Checkbox:
        case DestinyUnlockValueUIStyle.Automatic:
          displayStyle = null;
          booleanValue = objective.completionValue === 1;
          complete = objective.complete;
          break;
        default:
          displayStyle = null;
          complete = objective.complete;
      }

      return {
        displayName:
          def.displayProperties.name ||
          def.progressDescription ||
          (objective.complete ? t('Objectives.Complete') : t('Objectives.Incomplete')),
        description: def.displayProperties.description,
        progress: objective.progress || 0,
        completionValue: objective.completionValue,
        complete,
        boolean: booleanValue,
        displayStyle,
        display
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
    icon: def.displayProperties.hasIcon ? def.displayProperties.icon : '',
    progress:
      def.valueStyle === 5
        ? (flavorObjective.progress || 0) / flavorObjective.completionValue
        : (def.valueStyle === 6 || def.valueStyle === 0 ? flavorObjective.progress : 0) || 0
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

  const gridNodes = _.compact(
    talentGrid.nodes.map(
      (node): DimGridNode | undefined => {
        const talentNodeGroup = talentGridDef.nodes[node.nodeIndex];
        const talentNodeSelected = talentNodeGroup.steps[0];

        if (!talentNodeSelected) {
          return undefined;
        }

        const nodeName = talentNodeSelected.displayProperties.name;

        // Filter out some weird bogus nodes
        if (!nodeName || nodeName.length === 0 || talentNodeGroup.column < 0) {
          return undefined;
        }

        // Only one node in this column can be selected (scopes, etc)
        const exclusiveInColumn = Boolean(
          talentNodeGroup.exclusiveWithNodeHashes &&
            talentNodeGroup.exclusiveWithNodeHashes.length > 0
        );

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
          activated: node.isActivated,
          // The item level at which this node can be unlocked
          activatedAtGridLevel,
          // Only one node in this column can be selected (scopes, etc)
          exclusiveInColumn,
          // Whether or not the material cost has been paid for the node
          unlocked: true,
          // Some nodes don't show up in the grid, like purchased ascend nodes
          hidden: node.hidden
        };
      }
    )
  );

  if (!gridNodes.length) {
    return null;
  }

  // Fix for stuff that has nothing in early columns
  const minByColumn = _.minBy(gridNodes.filter((n) => !n.hidden), (n) => n.column)!;
  const minColumn = minByColumn.column;
  if (minColumn > 0) {
    gridNodes.forEach((node) => {
      node.column -= minColumn;
    });
  }

  return {
    nodes: _.sortBy(gridNodes, (node) => node.column + 0.1 * node.row),
    complete: gridNodes.every((n) => n.unlocked)
  };
}

function buildSockets(
  item: DestinyItemComponent,
  socketsMap: { [key: string]: DestinyItemSocketsComponent },
  defs: D2ManifestDefinitions,
  itemDef: DestinyInventoryItemDefinition
): DimSockets | null {
  if (
    !item.itemInstanceId ||
    !itemDef.sockets ||
    !itemDef.sockets.socketEntries.length ||
    !socketsMap[item.itemInstanceId]
  ) {
    return null;
  }
  const sockets = socketsMap[item.itemInstanceId].sockets;
  if (!sockets || !sockets.length) {
    return null;
  }

  const realSockets = sockets.map((socket, i) =>
    buildSocket(defs, socket, itemDef.sockets.socketEntries[i], i)
  );

  const categories = itemDef.sockets.socketCategories.map(
    (category): DimSocketCategory => {
      return {
        category: defs.SocketCategory.get(category.socketCategoryHash),
        sockets: category.socketIndexes
          .map((index) => realSockets[index])
          .filter(Boolean) as DimSocket[]
      };
    }
  );

  return {
    sockets: realSockets.filter(Boolean) as DimSocket[], // Flat list of sockets
    categories: _.sortBy(categories, (c) => c.category.index) // Sockets organized by category
  };
}

function buildDefinedSockets(
  defs: D2ManifestDefinitions,
  itemDef: DestinyInventoryItemDefinition
): DimSockets | null {
  const sockets = itemDef.sockets.socketEntries;
  if (!sockets || !sockets.length) {
    return null;
  }

  const realSockets = sockets.map((socket, i) => buildDefinedSocket(defs, socket, i));
  // TODO: check out intrinsicsockets as well

  const categories = itemDef.sockets.socketCategories.map(
    (category): DimSocketCategory => {
      return {
        category: defs.SocketCategory.get(category.socketCategoryHash),
        sockets: category.socketIndexes
          .map((index) => realSockets[index])
          .filter((s) => s.plugOptions.length)
      };
    }
  );

  return {
    sockets: realSockets, // Flat list of sockets
    categories: _.sortBy(categories, (c) => c.category.index) // Sockets organized by category
  };
}

/**
 * Plugs to hide from plug options (if not socketed)
 * removes the "Default Ornament" plug, "Default Shader" and "Rework Masterwork"
 * TODO: with AWA we may want to put some of these back
 */
const EXCLUDED_PLUGS = new Set([
  // Default ornament
  2931483505,
  1959648454,
  702981643,
  // Rework Masterwork
  39869035,
  1961001474,
  3612467353,
  // Default Shader
  4248210736
]);
function filterReusablePlug(reusablePlug: DimPlug) {
  return (
    !EXCLUDED_PLUGS.has(reusablePlug.plugItem.hash) &&
    // Masterwork Mods
    !(reusablePlug.plugItem.itemCategoryHashes || []).includes(141186804) &&
    // Ghost Projections
    !(reusablePlug.plugItem.itemCategoryHashes || []).includes(1404791674) &&
    !reusablePlug.plugItem.plug.plugCategoryIdentifier.includes('masterworks.stat')
  );
}

function buildDefinedSocket(
  defs: D2ManifestDefinitions,
  socket: DestinyItemSocketEntryDefinition,
  index: number
): DimSocket {
  // The currently equipped plug, if any
  const reusablePlugs = _.compact(
    (socket.reusablePlugItems || []).map((reusablePlug) => buildDefinedPlug(defs, reusablePlug))
  );
  const plugOptions: DimPlug[] = [];

  if (reusablePlugs.length) {
    reusablePlugs.forEach((reusablePlug) => {
      if (filterReusablePlug(reusablePlug)) {
        plugOptions.push(reusablePlug);
      }
    });
  }

  return {
    socketIndex: index,
    plug: null,
    plugOptions,
    hasRandomizedPlugItems: socket.randomizedPlugItems && socket.randomizedPlugItems.length > 0
  };
}

function isDestinyItemPlug(
  plug: DestinyItemPlug | DestinyItemSocketState
): plug is DestinyItemPlug {
  return Boolean((plug as DestinyItemPlug).plugItemHash);
}

function buildPlug(
  defs: D2ManifestDefinitions,
  plug: DestinyItemPlug | DestinyItemSocketState
): DimPlug | null {
  const plugHash = isDestinyItemPlug(plug) ? plug.plugItemHash : plug.plugHash;
  const enabled = isDestinyItemPlug(plug) ? plug.enabled : plug.isEnabled;

  const plugItem = plugHash && defs.InventoryItem.get(plugHash);
  if (!plugItem) {
    return null;
  }

  const failReasons = plug
    ? (plug.enableFailIndexes || [])
        .map((index) => plugItem.plug.enabledRules[index].failureMessage)
        .join('\n')
    : '';

  return {
    plugItem,
    enabled: enabled && (!isDestinyItemPlug(plug) || plug.canInsert),
    enableFailReasons: failReasons,
    plugObjectives: plug.plugObjectives || [],
    perks: (plugItem.perks || [])
      .map((perk) => perk.perkHash)
      .map((perkHash) => defs.SandboxPerk.get(perkHash)),
    // The first two hashes are the "Masterwork Upgrade" for weapons and armor. The category hash is for "Masterwork Mods"
    isMasterwork:
      plugItem.hash !== 236077174 &&
      plugItem.hash !== 1176735155 &&
      (plugItem.itemCategoryHashes || []).includes(141186804)
  };
}

function buildDefinedPlug(
  defs: D2ManifestDefinitions,
  plug: DestinyItemSocketEntryPlugItemDefinition
): DimPlug | null {
  const plugHash = plug.plugItemHash;

  const plugItem = plugHash && defs.InventoryItem.get(plugHash);
  if (!plugItem) {
    return null;
  }

  return {
    plugItem,
    enabled: true,
    enableFailReasons: '',
    plugObjectives: [],
    perks: (plugItem.perks || [])
      .map((perk) => perk.perkHash)
      .map((perkHash) => defs.SandboxPerk.get(perkHash)),
    isMasterwork:
      plugItem.plug.plugCategoryHash === 2109207426 || plugItem.plug.plugCategoryHash === 2989652629
  };
}

function buildSocket(
  defs: D2ManifestDefinitions,
  socket: DestinyItemSocketState,
  socketEntry: DestinyItemSocketEntryDefinition,
  index: number
): DimSocket | undefined {
  if (!socket.isVisible && !(socket.plugObjectives && socket.plugObjectives.length)) {
    return undefined;
  }

  // The currently equipped plug, if any
  const plug = buildPlug(defs, socket);
  const reusablePlugs = _.compact(
    (socket.reusablePlugs || []).map((reusablePlug) => buildPlug(defs, reusablePlug))
  );
  const plugOptions = plug ? [plug] : [];
  const hasRandomizedPlugItems =
    socketEntry.randomizedPlugItems && socketEntry.randomizedPlugItems.length > 0;

  if (reusablePlugs.length) {
    reusablePlugs.forEach((reusablePlug) => {
      if (filterReusablePlug(reusablePlug)) {
        if (plug && reusablePlug.plugItem.hash === plug.plugItem.hash) {
          plugOptions.push(plug);
          plugOptions.shift();
        } else {
          plugOptions.push(reusablePlug);
        }
      }
    });
  }

  return {
    socketIndex: index,
    plug,
    plugOptions,
    hasRandomizedPlugItems
  };
}

function buildForsakenMasterworkInfo(createdItem: D2Item, defs: D2ManifestDefinitions) {
  const masterworkSocket = createdItem.sockets!.sockets.find((socket) =>
    Boolean(
      socket.plug &&
        socket.plug.plugItem.plug &&
        (socket.plug.plugItem.plug.plugCategoryIdentifier.includes('masterworks.stat') ||
          socket.plug.plugItem.plug.plugCategoryIdentifier.endsWith('_masterwork'))
    )
  );
  if (masterworkSocket && masterworkSocket.plug) {
    if (masterworkSocket.plug.plugItem.investmentStats.length) {
      const masterwork = masterworkSocket.plug.plugItem.investmentStats[0];
      if (createdItem.bucket && createdItem.bucket.sort === 'Armor') {
        createdItem.dmg = [null, 'heroic', 'arc', 'solar', 'void'][
          resistanceMods[masterwork.statTypeHash]
        ] as typeof createdItem.dmg;
      }

      if (
        (createdItem.bucket.sort === 'Armor' && masterwork.value === 5) ||
        (createdItem.bucket.sort === 'Weapon' && masterwork.value === 10)
      ) {
        createdItem.masterwork = true;
      }
      const statDef = defs.Stat.get(masterwork.statTypeHash);

      createdItem.masterworkInfo = {
        typeName: null,
        typeIcon: masterworkSocket.plug.plugItem.displayProperties.icon,
        typeDesc: masterworkSocket.plug.plugItem.displayProperties.description,
        statHash: masterwork.statTypeHash,
        statName: statDef.displayProperties.name,
        statValue: masterwork.value
      };
    }

    const killTracker = createdItem.sockets!.sockets.find((socket) =>
      Boolean(socket.plug && socket.plug.plugObjectives.length)
    );

    if (
      killTracker &&
      killTracker.plug &&
      killTracker.plug.plugObjectives &&
      killTracker.plug.plugObjectives.length
    ) {
      const plugObjective = killTracker.plug.plugObjectives[0];

      const objectiveDef = defs.Objective.get(plugObjective.objectiveHash);
      createdItem.masterworkInfo = {
        ...createdItem.masterworkInfo,
        progress: plugObjective.progress,
        typeIcon: objectiveDef.displayProperties.icon,
        typeDesc: objectiveDef.progressDescription,
        typeName: [3244015567, 2285636663, 38912240].includes(killTracker.plug.plugItem.hash)
          ? 'Crucible'
          : 'Vanguard'
      };
    }
  }
}

// TODO: revisit this
function buildMasterworkInfo(
  sockets: DimSockets,
  defs: D2ManifestDefinitions
): DimMasterwork | null {
  const socket = sockets.sockets.find((socket) =>
    Boolean(socket.plug && socket.plug.plugObjectives.length)
  );
  if (
    !socket ||
    !socket.plug ||
    !socket.plug.plugObjectives ||
    !socket.plug.plugObjectives.length
  ) {
    return null;
  }
  const plugObjective = socket.plug.plugObjectives[0];
  const investmentStats = socket.plug.plugItem.investmentStats;
  if (!investmentStats || !investmentStats.length) {
    return null;
  }
  const statHash = investmentStats[0].statTypeHash;

  const objectiveDef = defs.Objective.get(plugObjective.objectiveHash);
  const statDef = defs.Stat.get(statHash);

  if (!objectiveDef || !statDef) {
    return null;
  }

  return {
    progress: plugObjective.progress,
    typeName: socket.plug.plugItem.plug.plugCategoryHash === 2109207426 ? 'Vanguard' : 'Crucible',
    typeIcon: objectiveDef.displayProperties.icon,
    typeDesc: objectiveDef.progressDescription,
    statHash,
    statName: statDef.displayProperties.name,
    statValue: investmentStats[0].value
  };
}

const MOD_CATEGORY = 59;
const POWER_STAT_HASH = 1935470627;

function getBasePowerLevel(item: D2Item): number {
  return item.primStat ? item.primStat.value : 0;
}

export function getPowerMods(item: D2Item): DestinyInventoryItemDefinition[] {
  return item.sockets
    ? _.compact(item.sockets.sockets.map((p) => p.plug && p.plug.plugItem)).filter((plug) => {
        return (
          plug.itemCategoryHashes &&
          plug.investmentStats &&
          plug.itemCategoryHashes.includes(MOD_CATEGORY) &&
          plug.investmentStats.some((s) => s.statTypeHash === POWER_STAT_HASH)
        );
      })
    : [];
}
