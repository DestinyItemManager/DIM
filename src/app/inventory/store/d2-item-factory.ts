import { D2Item, DimPerk } from '../item-types';
import {
  DestinyAmmunitionType,
  DestinyClass,
  DestinyCollectibleComponent,
  DestinyInventoryItemDefinition,
  DestinyItemComponent,
  DestinyItemComponentSetOfint64,
  DestinyItemInstanceComponent,
  DestinyItemType,
  DestinyObjectiveProgress,
  ItemBindStatus,
  ItemLocation,
  ItemState,
  TransferStatuses,
} from 'bungie-api-ts/destiny2';
import { buildFlavorObjective, buildObjectives } from './objectives';

import D2Events from 'data/d2/events.json';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions';
import { warnMissingDefinition } from '../../manifest/manifest-service-json';
import { D2SourcesToEvent } from 'data/d2/d2-event-info';
import { D2Store } from '../store-types';
import { D2StoresService } from '../d2-stores';
import { InventoryBuckets } from '../inventory-buckets';
import _ from 'lodash';
import { buildMasterwork } from './masterwork';
import { buildSockets } from './sockets';
import { buildStats } from './stats';
import { buildTalentGrid } from './talent-grids';
import { reportException } from '../../utils/exceptions';
import { t } from 'app/i18next-t';
import { getSeason } from './season';
import {
  ENGRAMS_BUCKET,
  MODIFICATIONS_BUCKET,
  SHADERS_BUCKET,
  THE_FORBIDDEN_BUCKET,
} from 'app/search/d2-known-values';
import { ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';

// Maps tierType to tierTypeName in English
const tiers = ['Unknown', 'Currency', 'Common', 'Uncommon', 'Rare', 'Legendary', 'Exotic'];

/**
 * A factory service for producing DIM inventory items.
 */

let _idTracker: { [id: string]: number } = {};
// A map from instance id to the last time it was manually moved this session
const _moveTouchTimestamps = new Map<string, number>();

const collectiblesByItemHash = _.once(
  (Collectible: ReturnType<D2ManifestDefinitions['Collectible']['getAll']>) =>
    _.keyBy(Collectible, (c) => c.itemHash)
);

/**
 * Prototype for Item objects - add methods to this to add them to all
 * items. Items use classic JS prototype inheritance.
 */
export const ItemProto = {
  // Can this item be equipped by the given store?
  canBeEquippedBy(this: D2Item, store: D2Store) {
    if (store.isVault) {
      return false;
    }

    return (
      this.equipment &&
      // For the right class
      (this.classType === DestinyClass.Unknown || this.classType === store.classType) &&
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
  },
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
 * @return a promise for the list of items
 */
export function processItems(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  owner: D2Store,
  items: DestinyItemComponent[],
  itemComponents: DestinyItemComponentSetOfint64,
  mergedCollectibles: {
    [hash: number]: DestinyCollectibleComponent;
  },
  uninstancedItemObjectives?: {
    [key: number]: DestinyObjectiveProgress[];
  }
): D2Item[] {
  const result: D2Item[] = [];
  for (const item of items) {
    let createdItem: D2Item | null = null;
    try {
      createdItem = makeItem(
        defs,
        buckets,
        itemComponents,
        item,
        owner,
        mergedCollectibles,
        uninstancedItemObjectives
      );
    } catch (e) {
      console.error('Error processing item', item, e);
      reportException('Processing Dim item', e);
    }
    if (createdItem !== null) {
      createdItem.owner = owner.id;
      result.push(createdItem);
    }
  }
  return result;
}

/** Set an ID for the item that should be unique across all items */
export function createItemIndex(item: D2Item): string {
  // Try to make a unique, but stable ID. This isn't always possible, such as in the case of consumables.
  let index = item.id;
  if (item.id === '0') {
    _idTracker[index] = (_idTracker[index] || 0) + 1;
    index = `${index}-t${_idTracker[index]}`;
  }

  return index;
}

const getClassTypeNameLocalized = _.memoize((type: DestinyClass, defs: D2ManifestDefinitions) => {
  const klass = Object.values(defs.Class).find((c) => c.classType === type);
  if (klass) {
    return klass.displayProperties.name;
  } else {
    return t('Loadouts.Any');
  }
});

/** Make a "fake" item from other information - used for Collectibles, etc. */
export function makeFakeItem(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  itemComponents: DestinyItemComponentSetOfint64 | undefined,
  itemHash: number,
  itemInstanceId: string = itemHash.toString(),
  quantity = 1,
  mergedCollectibles?: {
    [hash: number]: DestinyCollectibleComponent;
  }
): D2Item | null {
  return makeItem(
    defs,
    buckets,
    itemComponents,
    {
      itemHash,
      itemInstanceId,
      quantity,
      bindStatus: ItemBindStatus.NotBound,
      location: ItemLocation.Vendor,
      bucketHash: 0,
      transferStatus: TransferStatuses.NotTransferrable,
      lockable: false,
      state: ItemState.None,
      isWrapper: false,
      tooltipNotificationIndexes: [],
      metricObjective: {} as DestinyObjectiveProgress,
    },
    undefined,
    mergedCollectibles
  );
}

/**
 * Process a single raw item into a DIM item.
 * @param defs the manifest definitions
 * @param buckets the bucket definitions
 * @param previousItems a set of item IDs representing the previous store's items
 * @param newItems a set of item IDs representing the previous list of new items
 * @param item "raw" item from the Destiny API
 * @param owner the ID of the owning store.
 */
// TODO: extract item components first!
export function makeItem(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  itemComponents: DestinyItemComponentSetOfint64 | undefined,
  item: DestinyItemComponent,
  owner: D2Store | undefined,
  mergedCollectibles?: {
    [hash: number]: DestinyCollectibleComponent;
  },
  uninstancedItemObjectives?: {
    [key: number]: DestinyObjectiveProgress[];
  }
): D2Item | null {
  const itemDef = defs.InventoryItem.get(item.itemHash);
  const instanceDef: Partial<DestinyItemInstanceComponent> =
    item.itemInstanceId && itemComponents?.instances.data
      ? itemComponents.instances.data[item.itemInstanceId]
      : {};
  // Missing definition?
  if (!itemDef) {
    warnMissingDefinition();
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
    const collectibleDef = collectiblesByItemHash(defs.Collectible.getAll())[item.itemHash];
    if (collectibleDef) {
      displayProperties = collectibleDef.displayProperties;
    }
  }

  // def.bucketTypeHash is where it goes normally
  let normalBucket = buckets.byHash[itemDef.inventory!.bucketTypeHash];

  // https://github.com/Bungie-net/api/issues/687
  if (itemDef.inventory!.bucketTypeHash === THE_FORBIDDEN_BUCKET) {
    normalBucket = buckets.byHash[MODIFICATIONS_BUCKET];
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
  if (!currentBucket.inPostmaster && (owner?.isVault || item.location === ItemLocation.Vault)) {
    currentBucket = normalBucket;
  }

  const itemType = normalBucket.type || 'Unknown';

  // 34 = category hash for engrams
  const isEngram =
    itemDef.itemCategoryHashes?.includes(ItemCategoryHashes.Engrams) ||
    normalBucket.hash === ENGRAMS_BUCKET ||
    false;

  // https://github.com/Bungie-net/api/issues/134, class items had a primary stat
  // https://github.com/Bungie-net/api/issues/1079, engrams had a primary stat
  const primaryStat =
    itemDef.stats?.disablePrimaryStatDisplay || itemType === 'Class' || isEngram
      ? null
      : instanceDef?.primaryStat || null;

  // if a damageType isn't found, use the item's energy capacity element instead
  const element =
    (instanceDef?.damageTypeHash !== undefined &&
      defs.DamageType.get(instanceDef.damageTypeHash)) ||
    (instanceDef?.energy?.energyTypeHash !== undefined &&
      defs.EnergyType.get(instanceDef.energy.energyTypeHash)) ||
    null;

  const powerCapHash =
    item.versionNumber !== undefined &&
    itemDef.quality?.versions?.[item.versionNumber]?.powerCapHash;
  // ignore falsyness of 0, because powerCap && powerCapHash are never zero and the code gets ugly otherwise
  let powerCap = (powerCapHash && defs.PowerCap.get(powerCapHash).powerCap) || null;

  // here is where we need to manually adjust unreasonable powerCap values,
  // which are used for things that aren't currently set to ever cap
  if (powerCap && powerCap > 50000) {
    powerCap = null;
  }

  // null out falsy values like a blank string for a url
  const iconOverlay =
    (item.versionNumber !== undefined &&
      itemDef.quality?.displayVersionWatermarkIcons?.[item.versionNumber]) ||
    null;

  const collectible =
    itemDef.collectibleHash && mergedCollectibles && mergedCollectibles[itemDef.collectibleHash];

  let overrideStyleItem = item.overrideStyleItemHash
    ? defs.InventoryItem.get(item.overrideStyleItemHash)
    : null;

  if (overrideStyleItem?.plug?.isDummyPlug) {
    overrideStyleItem = null;
  }

  // Quest steps display their title as the quest line name, and their step name in the type position
  let name = displayProperties.name;
  let typeName = itemDef.itemTypeDisplayName || 'Unknown';
  if (
    itemDef.setData?.questLineName &&
    itemDef.setData?.questLineName !== itemDef.displayProperties.name
  ) {
    typeName = itemDef.displayProperties.name;
    name = itemDef.setData.questLineName;
  } else if (itemDef.objectives?.questlineItemHash) {
    const questLineItem = defs.InventoryItem.get(itemDef.objectives.questlineItemHash);
    if (questLineItem && questLineItem.displayProperties.name !== itemDef.displayProperties.name) {
      typeName = itemDef.displayProperties.name;
      name = questLineItem.displayProperties.name;
    }
  }

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
    tier: tiers[itemDef.inventory!.tierType] || 'Common',
    isExotic: tiers[itemDef.inventory!.tierType] === 'Exotic',
    isVendorItem: !owner || owner.id === null,
    name,
    description: displayProperties.description,
    icon:
      overrideStyleItem?.displayProperties.icon ||
      displayProperties.icon ||
      '/img/misc/missing_icon_d2.png',
    iconOverlay,
    secondaryIcon:
      overrideStyleItem?.secondaryIcon || itemDef.secondaryIcon || '/img/misc/missing_icon_d2.png',
    notransfer: Boolean(
      itemDef.nonTransferrable || item.transferStatus === TransferStatuses.NotTransferrable
    ),
    canPullFromPostmaster: !itemDef.doesPostmasterPullHaveSideEffects,
    id: item.itemInstanceId || '0', // zero for non-instanced is legacy hack
    equipped: Boolean(instanceDef?.isEquipped),
    equipment: Boolean(itemDef.equippingBlock), // TODO: this has a ton of good info for the item move logic
    equippingLabel: itemDef.equippingBlock?.uniqueLabel,
    complete: false,
    amount: item.quantity,
    primStat: primaryStat,
    typeName,
    equipRequiredLevel: instanceDef?.equipRequiredLevel ?? 0,
    maxStackSize: Math.max(itemDef.inventory!.maxStackSize, 1),
    uniqueStack: Boolean(itemDef.inventory!.stackUniqueLabel?.length),
    classType: itemDef.classType, // 0: titan, 1: hunter, 2: warlock, 3: any
    classTypeNameLocalized: getClassTypeNameLocalized(itemDef.classType, defs),
    element,
    energy: instanceDef?.energy ?? null,
    powerCap,
    breakerType: null,
    visible: true,
    lockable: item.lockable,
    trackable: Boolean(item.itemInstanceId && itemDef.objectives?.questlineItemHash),
    tracked: Boolean(item.state & ItemState.Tracked),
    locked: Boolean(item.state & ItemState.Locked),
    masterwork: Boolean(item.state & ItemState.Masterwork) && itemType !== 'Class',
    classified: Boolean(itemDef.redacted),
    isEngram,
    loreHash: itemDef.loreHash,
    lastManuallyMoved: item.itemInstanceId ? _moveTouchTimestamps.get(item.itemInstanceId) || 0 : 0,
    percentComplete: 0, // filled in later
    hidePercentage: false,
    talentGrid: null, // filled in later
    stats: null, // filled in later
    objectives: null, // filled in later
    dtrRating: null,
    previewVendor: itemDef.preview?.previewVendorHash,
    ammoType: itemDef.equippingBlock ? itemDef.equippingBlock.ammoType : DestinyAmmunitionType.None,
    source: itemDef.collectibleHash
      ? defs.Collectible.get(itemDef.collectibleHash, itemDef.hash)?.sourceHash
      : null,
    collectibleState: collectible ? collectible.state : null,
    collectibleHash: itemDef.collectibleHash || null,
    missingSockets: false,
    displaySource: itemDef.displaySource,
    plug: itemDef.plug?.energyCost && {
      energyCost: itemDef.plug.energyCost.energyCost,
      costElementIcon: defs.Stat.get(
        defs.EnergyType.get(itemDef.plug.energyCost.energyTypeHash).costStatHash
      ).displayProperties.icon,
    },
    metricHash: item.metricHash,
    metricObjective: item.metricObjective,
    availableMetricCategoryNodeHashes: itemDef.metrics?.availableMetricCategoryNodeHashes,
  });

  createdItem.season = getSeason(
    createdItem,
    (item.versionNumber !== undefined &&
      itemDef.quality?.displayVersionWatermarkIcons?.[item.versionNumber]) ||
      null
  );
  createdItem.event = createdItem.source
    ? D2SourcesToEvent[createdItem.source] || D2Events[item.itemHash]
    : D2Events[item.itemHash];

  // *able
  createdItem.taggable = Boolean(
    createdItem.lockable ||
      createdItem.classified ||
      // Shaders
      createdItem.bucket.hash === SHADERS_BUCKET
  );
  createdItem.comparable = Boolean(createdItem.equipment && createdItem.lockable);
  createdItem.reviewable = Boolean(
    $featureFlags.reviewsEnabled && isWeaponOrArmor1OrExoticArmor2(createdItem)
  );

  if (createdItem.primStat) {
    const statDef = defs.Stat.get(createdItem.primStat.statHash);
    createdItem.primStat.stat = statDef;
  }

  try {
    const socketInfo = buildSockets(item, itemComponents, defs, itemDef);
    createdItem.sockets = socketInfo.sockets;
    createdItem.missingSockets = socketInfo.missingSockets;
  } catch (e) {
    console.error(`Error building sockets for ${createdItem.name}`, item, itemDef, e);
    reportException('Sockets', e, { itemHash: item.itemHash });
  }

  try {
    const stats = itemComponents?.stats?.data;
    createdItem.stats = buildStats(createdItem, stats || null, itemDef, defs);
  } catch (e) {
    console.error(`Error building stats for ${createdItem.name}`, item, itemDef, e);
    reportException('Stats', e, { itemHash: item.itemHash });
  }

  try {
    const talentData = itemComponents?.talentGrids?.data;
    if (talentData) {
      createdItem.talentGrid = buildTalentGrid(item, talentData, defs);
    }
  } catch (e) {
    console.error(`Error building talent grid for ${createdItem.name}`, item, itemDef, e);
    reportException('TalentGrid', e, { itemHash: item.itemHash });
  }

  const objectiveData = itemComponents?.objectives?.data;
  try {
    if (objectiveData) {
      createdItem.objectives = buildObjectives(
        item,
        objectiveData,
        defs,
        uninstancedItemObjectives
      );
    }
  } catch (e) {
    console.error(`Error building objectives for ${createdItem.name}`, item, itemDef, e);
    reportException('Objectives', e, { itemHash: item.itemHash });
  }

  try {
    if (objectiveData) {
      createdItem.flavorObjective = buildFlavorObjective(item, objectiveData, defs);
    }
  } catch (e) {
    console.error(`Error building flavor objectives for ${createdItem.name}`, item, itemDef, e);
    reportException('FlavorObjectives', e, { itemHash: item.itemHash });
  }

  // TODO: Are these ever defined??
  if (itemDef.perks?.length) {
    createdItem.perks = itemDef.perks
      .map(
        (p): DimPerk => ({
          requirement: p.requirementDisplayString,
          ...defs.SandboxPerk.get(p.perkHash),
        })
      )
      .filter((p) => p.isDisplayable);
    if (createdItem.perks.length === 0) {
      createdItem.perks = null;
    }
  }

  // Compute complete / completion percentage
  if (createdItem.objectives) {
    const length = createdItem.objectives.length;
    if (length > 0) {
      createdItem.complete = createdItem.objectives.every((o) => o.complete);
      createdItem.percentComplete = _.sumBy(createdItem.objectives, (objective) => {
        if (objective.completionValue) {
          return Math.min(1, (objective.progress || 0) / objective.completionValue) / length;
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
    const multiEmblem = createdItem.sockets.allSockets.filter(
      (socket) => socket.plugged?.plugDef.itemType === DestinyItemType.Emblem
    );
    const selectedEmblem = multiEmblem[0]?.plugged;

    if (selectedEmblem) {
      createdItem.secondaryIcon = selectedEmblem.plugDef.secondaryIcon;
    }
  }

  // a weapon can have an inherent breaker type, or gain one from socketed mods
  // (or armor mods can sort of add them but let's not go there quite yet)
  // this is presented as an else-type dichotomy here, but who knows what the future holds
  if (itemDef.breakerTypeHash) {
    createdItem.breakerType = defs.BreakerType.get(itemDef.breakerTypeHash);
  } else if (createdItem.bucket.inWeapons && createdItem.sockets) {
    const breakerTypeHash = createdItem.sockets.allSockets.find(
      (s) => s.plugged?.plugDef.breakerTypeHash
    )?.plugged?.plugDef.breakerTypeHash;
    if (breakerTypeHash) {
      createdItem.breakerType = defs.BreakerType.get(breakerTypeHash);
    }
  }

  // Infusion
  const tier = itemDef.inventory ? defs.ItemTierType[itemDef.inventory.tierTypeHash] : null;
  createdItem.infusionProcess = tier?.infusionProcess ?? null;
  createdItem.infusionFuel = Boolean(
    createdItem.infusionProcess && itemDef.quality?.infusionCategoryHashes?.length
  );
  createdItem.infusable = createdItem.infusionFuel && isLegendaryOrBetter(createdItem);
  createdItem.infusionQuality = itemDef.quality || null;

  // Masterwork
  try {
    createdItem.masterworkInfo = buildMasterwork(createdItem, defs);
  } catch (e) {
    console.error(`Error building masterwork info for ${createdItem.name}`, item, itemDef, e);
    reportException('MasterworkInfo', e, { itemHash: item.itemHash });
  }

  try {
    buildPursuitInfo(createdItem, item, itemDef);
  } catch (e) {
    console.error(`Error building Quest info for ${createdItem.name}`, item, itemDef, e);
    reportException('Quest', e, { itemHash: item.itemHash });
  }

  // TODO: Phase out "base power"
  if (createdItem.primStat) {
    createdItem.basePower = createdItem.primStat ? createdItem.primStat.value : 0;
  }

  createdItem.index = createItemIndex(createdItem);

  return createdItem;
}

function isWeaponOrArmor1OrExoticArmor2(item: D2Item) {
  return (
    item.primStat &&
    (item.primStat.statHash === StatHashes.Attack || // weapon
      (item.primStat.statHash === StatHashes.Defense && // armor
        (!item.energy || // energy is an armor 2.0 signifier
          item.isExotic))) // but we want to allow exotic armor 2.0 reviews
  );
}

function isLegendaryOrBetter(item) {
  return item.tier === 'Legendary' || item.tier === 'Exotic';
}

function buildPursuitInfo(
  createdItem: D2Item,
  item: DestinyItemComponent,
  itemDef: DestinyInventoryItemDefinition
) {
  if (item.expirationDate) {
    createdItem.pursuit = {
      expirationDate: new Date(item.expirationDate),
      rewards: [],
      suppressExpirationWhenObjectivesComplete: Boolean(
        itemDef.inventory!.suppressExpirationWhenObjectivesComplete
      ),
      expiredInActivityMessage: itemDef.inventory!.expiredInActivityMessage,
      places: [],
      activityTypes: [],
      modifierHashes: [],
    };
  }
  const rewards = itemDef.value ? itemDef.value.itemValue.filter((v) => v.itemHash) : [];
  if (rewards.length) {
    createdItem.pursuit = {
      suppressExpirationWhenObjectivesComplete: false,
      places: [],
      activityTypes: [],
      modifierHashes: [],
      ...createdItem.pursuit,
      rewards,
    };
  }
}
