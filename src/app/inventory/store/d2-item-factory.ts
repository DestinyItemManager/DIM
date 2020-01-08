import {
  DestinyClass,
  DestinyInventoryItemDefinition,
  DestinyItemComponent,
  DestinyItemComponentSetOfint64,
  DestinyItemInstanceComponent,
  DestinyItemType,
  ItemLocation,
  TransferStatuses,
  DestinyAmmunitionType,
  ItemState,
  DestinyCollectibleComponent,
  DestinyObjectiveProgress,
  DamageType
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions';
import { reportException } from '../../utils/exceptions';

import { D2ManifestService } from '../../manifest/manifest-service-json';
import { NewItemsService } from './new-items';
import { ItemInfoSource } from '../dim-item-info';
import { t } from 'app/i18next-t';
import { D2Item, DimPerk } from '../item-types';
import { D2Store } from '../store-types';
import { InventoryBuckets } from '../inventory-buckets';
import { D2StoresService } from '../d2-stores';
import { D2CalculatedSeason, D2CurrentSeason } from '../d2-season-info';
import { D2SourcesToEvent } from 'data/d2/d2-event-info';
import D2Seasons from 'data/d2/seasons.json';
import D2SeasonToSource from 'data/d2/seasonToSource.json';
import D2Events from 'data/d2/events.json';
import { buildStats } from './stats';
import { buildSockets } from './sockets';
import { buildMasterwork } from './masterwork';
import { buildObjectives, buildFlavorObjective } from './objectives';
import { buildTalentGrid } from './talent-grids';
import { energyCapacityTypeNames } from 'app/item-popup/EnergyMeter';
import definitionReplacements from 'data/d2/item-def-workaround-replacements.json';

// Maps tierType to tierTypeName in English
const tiers = ['Unknown', 'Currency', 'Common', 'Uncommon', 'Rare', 'Legendary', 'Exotic'];

export const damageTypeNames: { [key in DamageType]: string | null } = {
  [DamageType.None]: null,
  [DamageType.Kinetic]: 'kinetic',
  [DamageType.Arc]: 'arc',
  [DamageType.Thermal]: 'solar',
  [DamageType.Void]: 'void',
  [DamageType.Raid]: 'raid'
};

/**
 * A factory service for producing DIM inventory items.
 */

let _idTracker: { [id: string]: number } = {};
// A map from instance id to the last time it was manually moved this session
const _moveTouchTimestamps = new Map<string, number>();

const SourceToD2Season = D2SeasonToSource.sources;

const collectiblesByItemHash = _.once((Collectible) =>
  _.keyBy(Collectible.getAll(), (c) => c.itemHash)
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
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  owner: D2Store,
  items: DestinyItemComponent[],
  itemComponents: DestinyItemComponentSetOfint64,
  previousItems: Set<string> = new Set(),
  newItems: Set<string> = new Set(),
  itemInfoService: ItemInfoSource,
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
        previousItems,
        newItems,
        itemInfoService,
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
  mergedCollectibles?: {
    [hash: number]: DestinyCollectibleComponent;
  },
  uninstancedItemObjectives?: {
    [key: number]: DestinyObjectiveProgress[];
  }
): D2Item | null {
  // Fix Sundial Weapons definitions.
  // https://github.com/Bungie-net/api/issues/1170
  if (item.itemHash in definitionReplacements) {
    (item as any).itemHash = definitionReplacements[item.itemHash];
  }
  const itemDef = defs.InventoryItem.get(item.itemHash);
  const instanceDef: Partial<DestinyItemInstanceComponent> =
    item.itemInstanceId && itemComponents?.instances.data
      ? itemComponents.instances.data[item.itemInstanceId]
      : {};
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
  if (!currentBucket.inPostmaster && (owner?.isVault || item.location === ItemLocation.Vault)) {
    currentBucket = normalBucket;
  }

  const itemType = normalBucket.type || 'Unknown';

  // 34 = category hash for engrams
  const isEngram = itemDef.itemCategoryHashes?.includes(34) || false;

  // https://github.com/Bungie-net/api/issues/134, class items had a primary stat
  // https://github.com/Bungie-net/api/issues/1079, engrams had a primary stat
  const primaryStat =
    itemDef.stats?.disablePrimaryStatDisplay || itemType === 'Class' || isEngram
      ? null
      : instanceDef?.primaryStat || null;

  // if a damageType isn't found, use the item's energy capacity element instead
  const damageType = instanceDef?.damageType || itemDef.defaultDamageType || DamageType.None;
  const dmgName =
    damageTypeNames[damageType] ||
    (instanceDef?.energy && energyCapacityTypeNames[instanceDef.energy.energyType]) ||
    null;

  const collectible =
    itemDef.collectibleHash && mergedCollectibles && mergedCollectibles[itemDef.collectibleHash];

  let overrideStyleItem = item.overrideStyleItemHash
    ? defs.InventoryItem.get(item.overrideStyleItemHash)
    : null;

  if (overrideStyleItem?.plug?.isDummyPlug) {
    overrideStyleItem = null;
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
    tier: tiers[itemDef.inventory.tierType] || 'Common',
    isExotic: tiers[itemDef.inventory.tierType] === 'Exotic',
    isVendorItem: !owner || owner.id === null,
    name: displayProperties.name,
    description: displayProperties.description,
    icon:
      overrideStyleItem?.displayProperties.icon ||
      displayProperties.icon ||
      '/img/misc/missing_icon_d2.png',
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
    typeName: itemDef.itemTypeDisplayName || 'Unknown',
    equipRequiredLevel: instanceDef?.equipRequiredLevel ?? 0,
    maxStackSize: Math.max(itemDef.inventory.maxStackSize, 1),
    uniqueStack: Boolean(itemDef.inventory.stackUniqueLabel?.length),
    // 0: titan, 1: hunter, 2: warlock, 3: any
    classType: itemDef.classType,
    classTypeNameLocalized: getClassTypeNameLocalized(itemDef.classType, defs),
    dmg: dmgName,
    energy: instanceDef?.energy ?? null,
    visible: true,
    lockable: item.lockable,
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
      ? defs.Collectible.get(itemDef.collectibleHash).sourceHash
      : null,
    collectibleState: collectible ? collectible.state : null,
    collectibleHash: itemDef.collectibleHash || null,
    missingSockets: false,
    displaySource: itemDef.displaySource,
    plug: itemDef.plug &&
      itemDef.plug.energyCost && {
        energyCost: itemDef.plug.energyCost.energyCost,
        costElementIcon: defs.Stat.get(
          defs.EnergyType.get(itemDef.plug.energyCost.energyTypeHash).costStatHash
        ).displayProperties.icon
      }
  });

  createdItem.season = getSeason(createdItem);
  createdItem.event = createdItem.source
    ? D2SourcesToEvent[createdItem.source] || D2Events[item.itemHash]
    : D2Events[item.itemHash];

  // *able
  createdItem.taggable = Boolean(createdItem.lockable || createdItem.classified);
  createdItem.comparable = Boolean(createdItem.equipment && createdItem.lockable);
  createdItem.reviewable = Boolean($featureFlags.reviewsEnabled && isWeaponOrArmor1(createdItem));

  if (createdItem.primStat) {
    const statDef = defs.Stat.get(createdItem.primStat.statHash);
    createdItem.primStat.stat = Object.create(statDef);
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
      createdItem.dimInfo = itemInfoService.infoForItem(createdItem);
    } catch (e) {
      console.error(`Error getting extra DIM info for ${createdItem.name}`, item, itemDef, e);
      reportException('DimInfo', e, { itemHash: item.itemHash });
    }
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
          ...defs.SandboxPerk.get(p.perkHash)
        })
      )
      .filter((p) => p.isDisplayable);
    if (createdItem.perks.length === 0) {
      createdItem.perks = null;
    }
  }

  // Compute complete / completion percentage
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
      (plug) => plug.plug?.plugItem.itemType === DestinyItemType.Emblem
    );
    const selectedEmblem = multiEmblem[0] && multiEmblem[0].plug;

    if (selectedEmblem) {
      createdItem.secondaryIcon = selectedEmblem.plugItem.secondaryIcon;
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

function isWeaponOrArmor1(item: D2Item) {
  return (
    item.primStat &&
    !item.energy && // energy is an armor 2.0 signifier
    (item.primStat.statHash === 1480404414 || // weapon
      item.primStat.statHash === 3897883278) // armor
  );
}

function isLegendaryOrBetter(item) {
  return item.tier === 'Legendary' || item.tier === 'Exotic';
}

function getSeason(item: D2Item): number {
  if (item.classified) {
    return D2CalculatedSeason;
  }
  if (
    !item.itemCategoryHashes.length ||
    item.typeName === 'Unknown' ||
    item.itemCategoryHashes.some((itemHash) =>
      D2SeasonToSource.categoryBlacklist.includes(itemHash)
    )
  ) {
    return 0;
  }

  if (SourceToD2Season[item.source]) {
    return SourceToD2Season[item.source];
  }

  return D2Seasons[item.hash] || D2CalculatedSeason || D2CurrentSeason;
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
        itemDef.inventory.suppressExpirationWhenObjectivesComplete
      ),
      expiredInActivityMessage: itemDef.inventory.expiredInActivityMessage,
      places: [],
      activityTypes: [],
      modifierHashes: []
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
      rewards
    };
  }
}
