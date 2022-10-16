import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { t } from 'app/i18next-t';
import { isTrialsPassage, isWinsObjective } from 'app/inventory/store/objectives';
import {
  D2ItemTiers,
  d2MissingIcon,
  THE_FORBIDDEN_BUCKET,
  uniqueEquipBuckets,
} from 'app/search/d2-known-values';
import { lightStats } from 'app/search/search-filter-values';
import { errorLog, warnLog } from 'app/utils/log';
import { countEnhancedPerks } from 'app/utils/socket-utils';
import {
  BucketCategory,
  ComponentPrivacySetting,
  DestinyAmmunitionType,
  DestinyClass,
  DestinyCollectibleComponent,
  DestinyCollectibleState,
  DestinyInventoryItemDefinition,
  DestinyItemComponent,
  DestinyItemComponentSetOfint64,
  DestinyItemInstanceComponent,
  DestinyItemResponse,
  DestinyItemSubType,
  DestinyItemType,
  DestinyObjectiveProgress,
  DestinyProfileRecordsComponent,
  DictionaryComponentResponse,
  ItemBindStatus,
  ItemLocation,
  ItemPerkVisibility,
  ItemState,
  SingleComponentResponse,
  TransferStatuses,
} from 'bungie-api-ts/destiny2';
import enhancedIntrinsics from 'data/d2/crafting-enhanced-intrinsics';
import extendedBreaker from 'data/d2/extended-breaker.json';
import extendedFoundry from 'data/d2/extended-foundry.json';
import extendedICH from 'data/d2/extended-ich.json';
import { BucketHashes, ItemCategoryHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import memoizeOne from 'memoize-one';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions';
import { warnMissingDefinition } from '../../manifest/manifest-service-json';
import { reportException } from '../../utils/exceptions';
import { InventoryBuckets } from '../inventory-buckets';
import { DimItem } from '../item-types';
import { DimStore } from '../store-types';
import { getVault } from '../stores-helpers';
import { buildCatalystInfo } from './catalyst';
import { buildCraftedInfo } from './crafted';
import { buildDeepsightInfo } from './deepsight';
import { createItemIndex } from './item-index';
import { buildMasterwork } from './masterwork';
import { buildObjectives } from './objectives';
import { buildPatternInfo } from './patterns';
import { buildSockets } from './sockets';
import { buildStats } from './stats';

const collectiblesByItemHash = memoizeOne(
  (Collectible: ReturnType<D2ManifestDefinitions['Collectible']['getAll']>) =>
    _.keyBy(Collectible, (c) => c.itemHash)
);

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
  owner: DimStore,
  items: DestinyItemComponent[],
  itemComponents: DestinyItemComponentSetOfint64,
  mergedCollectibles: {
    [hash: number]: DestinyCollectibleComponent;
  },
  uninstancedItemObjectives?: {
    [key: number]: DestinyObjectiveProgress[];
  },
  profileRecords?: DestinyProfileRecordsComponent
): DimItem[] {
  const result: DimItem[] = [];

  for (const item of items) {
    let createdItem: DimItem | null = null;
    try {
      createdItem = makeItem(
        defs,
        buckets,
        itemComponents,
        item,
        owner,
        mergedCollectibles,
        uninstancedItemObjectives,
        profileRecords
      );
    } catch (e) {
      errorLog('d2-stores', 'Error processing item', item, e);
      reportException('Processing Dim item', e);
    }
    if (
      createdItem !== null &&
      // we want to allow makeItem to generate dummy items. they're useful in vendors, as consumables, etc.
      // but processItems is for building stores, and we don't want dummy weapons or armor,
      // which can invisibly interfere with allItems calculations and measurements
      createdItem.location.hash !== THE_FORBIDDEN_BUCKET
    ) {
      createdItem.owner = owner.id;
      result.push(createdItem);
    } else {
      // the item failed to be created for some reason. 2 things can currently cause this:
      // an exception occurred, or the item lacks a definition
      // not all of these should cause the store to consider itself hadErrors.
      // dummies and invisible items are not a big deal

      const bucketDef = defs.InventoryBucket[item.bucketHash];
      // if it's a named, non-invisible bucket, it may be a problem that the item wasn't generated
      if (
        bucketDef &&
        bucketDef.category !== BucketCategory.Invisible &&
        bucketDef.displayProperties.name
      ) {
        const itemDef = defs.InventoryItem.get(item.itemHash);
        reportException('setting store hadErrors', new Error('setting store hadErrors'), {
          itemHash: item.itemHash,
          hasDefinition: Boolean(itemDef),
          hasName: Boolean(itemDef?.displayProperties.name),
          hasQuestLineName: Boolean(itemDef?.setData?.questLineName),
          itemBucketHash: item.bucketHash,
          defBucketHash: itemDef?.inventory?.bucketTypeHash,
          bucketName: bucketDef.displayProperties.name,
        });
        owner.hadErrors = true;
      }
    }
  }
  return result;
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
  itemInstanceId?: string,
  quantity?: number,
  mergedCollectibles?: {
    [hash: number]: DestinyCollectibleComponent;
  },
  profileRecords?: DestinyProfileRecordsComponent,
  allowWishList?: boolean
): DimItem | null {
  const item = makeItem(
    defs,
    buckets,
    itemComponents,
    {
      itemHash,
      itemInstanceId: itemInstanceId ?? '0',
      quantity: quantity ?? 1,
      bindStatus: ItemBindStatus.NotBound,
      location: ItemLocation.Vendor,
      bucketHash: 0,
      transferStatus: TransferStatuses.NotTransferrable,
      itemValueVisibility: [],
      lockable: false,
      state: ItemState.None,
      isWrapper: false,
      tooltipNotificationIndexes: [],
      metricObjective: {} as DestinyObjectiveProgress,
      versionNumber: defs.InventoryItem.get(itemHash)?.quality?.currentVersion,
    },
    undefined,
    mergedCollectibles,
    undefined,
    profileRecords
  );

  if (item && !allowWishList) {
    item.wishListEnabled = false;
  }
  return item;
}

/**
 * Create a single item from a DestinyItemResponse, either from getItemDetails or an AWA result.
 * We can use this item to refresh a single item in the store from this response.
 */
export function makeItemSingle(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  item: DestinyItemResponse,
  stores: DimStore[],
  mergedCollectibles?: {
    [hash: number]: DestinyCollectibleComponent;
  }
): DimItem | null {
  if (!item.item.data) {
    return null;
  }

  const owner = item.characterId ? stores.find((s) => s.id === item.characterId) : getVault(stores);

  const itemId = item.item.data.itemInstanceId;

  // Convert a single component response into a dictionary component response
  const empty = { privacy: ComponentPrivacySetting.Public, data: {} };
  const m: <V>(v: SingleComponentResponse<V>) => DictionaryComponentResponse<V> = itemId
    ? (v) => (v ? { privacy: v.privacy, data: v.data ? { [itemId]: v.data } : {} } : empty)
    : () => empty;

  // Make it look like a full response
  return makeItem(
    defs,
    buckets,
    {
      instances: m(item.instance),
      perks: m(item.perks),
      renderData: m(item.renderData),
      stats: m(item.stats),
      sockets: m(item.sockets),
      reusablePlugs: m(item.reusablePlugs),
      plugObjectives: m(item.plugObjectives),
      talentGrids: m(item.talentGrid),
      plugStates: empty,
      objectives: m(item.objectives),
    },
    item.item.data,
    owner,
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
 * @param owner the ID of the owning store
 * @param mergedCollectibles collectible information so each DimItem is self-aware of whether it's already owned
 * @param uninstancedItemObjectives the owning character's dictionary of uninstanced objectives
 */
// TODO: extract individual item components first!
export function makeItem(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  itemComponents: DestinyItemComponentSetOfint64 | undefined,
  item: DestinyItemComponent,
  owner: DimStore | undefined,
  mergedCollectibles?: {
    [hash: number]: DestinyCollectibleComponent;
  },
  uninstancedItemObjectives?: {
    [key: number]: DestinyObjectiveProgress[];
  },
  profileRecords?: DestinyProfileRecordsComponent
): DimItem | null {
  const itemDef = defs.InventoryItem.get(item.itemHash);

  const itemInstanceData: Partial<DestinyItemInstanceComponent> =
    itemComponents?.instances.data?.[item.itemInstanceId ?? ''] ?? {};

  // Missing definition?
  if (!itemDef) {
    warnMissingDefinition();
    return null;
  }

  if (itemDef.redacted) {
    warnLog(
      'd2-stores',
      'Missing Item Definition:\n\n',
      { item, itemDef, itemInstanceData },
      '\n\nThis item is not in the current manifest and will be added at a later time by Bungie.'
    );
  }

  if (!(itemDef.displayProperties.name || itemDef.setData?.questLineName)) {
    if (item.itemHash === 3377778206) {
      // https://d2.destinygamewiki.com/wiki/Gift_of_the_Lighthouse
      (itemDef.displayProperties as any).name = 'Gift of the Lighthouse';
    } else {
      (itemDef.displayProperties as any).name = '???';
    }
  }

  let displayProperties = itemDef.displayProperties;
  if (itemDef.redacted) {
    // Fill in display info from the collectible, sometimes it's not redacted there!
    const collectibleDef = collectiblesByItemHash(defs.Collectible.getAll())[item.itemHash];
    if (collectibleDef) {
      displayProperties = collectibleDef.displayProperties;
    }
  }

  // shaders currently claim they belong in the Forbidden Bucket, but they can be physically
  // present in the Vault, taking up space. so: we'll claim they are Consumables.
  // (so that they show up in DIM, but don't cause a whole separate inventory section)

  // they aren't transferrable, and stop existing if removed from the vault, so they won't
  // interfere with the 50 consumables bucket limit.
  const needsShaderFix =
    itemDef.inventory!.bucketTypeHash === THE_FORBIDDEN_BUCKET &&
    itemDef.itemCategoryHashes?.includes(ItemCategoryHashes.Shaders);
  // The same thing can happen with mods!
  const needsModsFix =
    itemDef.inventory!.bucketTypeHash === THE_FORBIDDEN_BUCKET &&
    itemDef.itemCategoryHashes?.includes(ItemCategoryHashes.Mods_Mod);

  // this is where the item would go normally (if not vaulted/postmastered).
  // it is stored in DimItem.bucket
  const normalBucketHash = needsShaderFix
    ? BucketHashes.Consumables
    : needsModsFix
    ? BucketHashes.Modifications
    : itemDef.inventory!.bucketTypeHash;
  let normalBucket = buckets.byHash[normalBucketHash];

  // this is where the item IS, right now.
  // it is stored in DimItem.location
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

  const isEngram =
    itemDef.itemCategoryHashes?.includes(ItemCategoryHashes.Engrams) ||
    normalBucket.hash === BucketHashes.Engrams ||
    false;

  // https://github.com/Bungie-net/api/issues/134, class items had a primary stat

  let primaryStat: DimItem['primaryStat'] = null;
  if (
    itemInstanceData.primaryStat &&
    itemType !== 'Class' &&
    !itemDef.stats?.disablePrimaryStatDisplay
  ) {
    primaryStat = {
      ...itemInstanceData.primaryStat,
      stat: defs.Stat.get(itemInstanceData.primaryStat.statHash),
      value: itemInstanceData.primaryStat.value,
    };
  }

  if (
    // engrams have a weird primary stat but their quality has their PL
    isEngram ||
    // classified items have no Stats, but their quality has their PL
    (!primaryStat &&
      itemDef.redacted &&
      itemInstanceData.itemLevel &&
      itemInstanceData.quality !== undefined &&
      (D2Categories.Weapons.includes(item.bucketHash) ||
        D2Categories.Armor.includes(item.bucketHash)))
  ) {
    primaryStat = {
      stat: defs.Stat.get(StatHashes.Power),
      statHash: StatHashes.Power,
      value: (itemInstanceData.itemLevel ?? 0) * 10 + (itemInstanceData.quality ?? 0),
    };
  }

  // if a damageType isn't found, use the item's energy capacity element instead
  const element =
    (itemInstanceData.damageTypeHash !== undefined &&
      defs.DamageType.get(itemInstanceData.damageTypeHash)) ||
    (itemDef.defaultDamageTypeHash !== undefined &&
      defs.DamageType.get(itemDef.defaultDamageTypeHash)) ||
    (itemInstanceData.energy?.energyTypeHash !== undefined &&
      defs.EnergyType.get(itemInstanceData.energy.energyTypeHash)) ||
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

  const hiddenOverlay = itemDef.iconWatermark;

  const tooltipNotifications = (item.tooltipNotificationIndexes ?? [])
    // why the optional chain? well, somehow, an item can return tooltipNotificationIndexes,
    // but have no tooltipNotifications in its def
    .map((i) => itemDef.tooltipNotifications?.[i])
    .filter(Boolean)
    // a temporary filter because as of witch queen, all tooltips are set to "on"
    .filter((t) => t && t.displayStyle !== 'ui_display_style_info');

  // null out falsy values like a blank string for a url
  const iconOverlay =
    (item.versionNumber !== undefined &&
      itemDef.quality?.displayVersionWatermarkIcons?.[item.versionNumber]) ||
    itemDef.iconWatermark ||
    itemDef.iconWatermarkShelved ||
    undefined;

  // collection stuff: establish a collectedness state, and hashes leading to the collectible and source
  const { collectibleHash } = itemDef;
  let collectibleState: DestinyCollectibleState | undefined;
  if (collectibleHash) {
    collectibleState = mergedCollectibles?.[collectibleHash]?.state;
  }
  const source = collectibleHash
    ? defs.Collectible.get(collectibleHash, itemDef.hash)?.sourceHash
    : undefined;

  // items' appearance can be overridden at bungie's request
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

  // we cannot trust the claimed class of redacted items. they all say Titan
  const classType = itemDef.redacted
    ? normalBucket.inArmor
      ? itemInstanceData?.isEquipped && owner
        ? // equipped armor gets marked as that character's class
          owner.classType
        : // unequipped armor gets marked "no class"
          -1
      : // other items are marked "any class"
        DestinyClass.Unknown
    : itemDef.classType;

  const createdItem: DimItem = {
    owner: owner?.id || 'unknown',
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
    tier: D2ItemTiers[itemDef.inventory!.tierType] || 'Common',
    isExotic: D2ItemTiers[itemDef.inventory!.tierType] === 'Exotic',
    name,
    description: displayProperties.description,
    icon: overrideStyleItem?.displayProperties.icon || displayProperties.icon || d2MissingIcon,
    hiddenOverlay,
    iconOverlay,
    secondaryIcon: overrideStyleItem?.secondaryIcon || itemDef.secondaryIcon || itemDef.screenshot,
    notransfer: Boolean(
      itemDef.nonTransferrable || item.transferStatus === TransferStatuses.NotTransferrable
    ),
    canPullFromPostmaster: !itemDef.doesPostmasterPullHaveSideEffects,
    id: item.itemInstanceId || '0', // zero for non-instanced is legacy hack
    instanced: Boolean(item.itemInstanceId && item.itemInstanceId !== '0'),
    equipped: Boolean(itemInstanceData.isEquipped),
    // TODO: equippingBlock has a ton of good info for the item move logic
    equipment:
      (itemDef.equippingBlock ||
        // redacted items seem to have a correct boolean but no detailed equipping block info
        (itemDef.redacted && itemDef.equippable)) &&
      !uniqueEquipBuckets.includes(normalBucket.hash),
    equippingLabel: itemDef.equippingBlock?.uniqueLabel,
    complete: false,
    amount: item.quantity || 1,
    primaryStat: primaryStat,
    typeName,
    equipRequiredLevel: itemInstanceData.equipRequiredLevel ?? 0,
    maxStackSize: Math.max(itemDef.inventory!.maxStackSize, 1),
    uniqueStack: Boolean(itemDef.inventory!.stackUniqueLabel?.length),
    classType,
    classTypeNameLocalized: getClassTypeNameLocalized(itemDef.classType, defs),
    element,
    energy: itemInstanceData.energy ?? null,
    powerCap,
    lockable: itemType !== 'Finishers' ? item.lockable : true,
    trackable: Boolean(item.itemInstanceId && itemDef.objectives?.questlineItemHash),
    tracked: Boolean(item.state & ItemState.Tracked),
    locked: Boolean(item.state & ItemState.Locked),
    masterwork: Boolean(item.state & ItemState.Masterwork) && itemType !== 'Class',
    crafted: Boolean(item.state & ItemState.Crafted),
    highlightedObjective: Boolean(item.state & ItemState.HighlightedObjective),
    classified: Boolean(itemDef.redacted),
    isEngram,
    loreHash: itemDef.loreHash,
    previewVendor: itemDef.preview?.previewVendorHash,
    ammoType: itemDef.equippingBlock ? itemDef.equippingBlock.ammoType : DestinyAmmunitionType.None,
    source,
    collectibleState,
    collectibleHash,
    missingSockets: false,
    displaySource: itemDef.displaySource,
    plug: itemDef.plug && {
      energyCost: itemDef.plug.energyCost?.energyCost || 0,
      costElementIcon: itemDef.plug.energyCost
        ? defs.Stat.get(defs.EnergyType.get(itemDef.plug.energyCost.energyTypeHash).costStatHash)
            .displayProperties.icon
        : undefined,
    },
    metricHash: item.metricHash,
    metricObjective: item.metricObjective,
    availableMetricCategoryNodeHashes: itemDef.metrics?.availableMetricCategoryNodeHashes,
    // These get filled in later
    breakerType: null,
    foundry: null,
    percentComplete: 0,
    hidePercentage: false,
    stats: null,
    objectives: null,
    pursuit: null,
    taggable: false,
    comparable: false,
    wishListEnabled: false,
    power: 0,
    index: '',
    infusable: false,
    infusionFuel: false,
    sockets: null,
    masterworkInfo: null,
    infusionQuality: null,
    tooltipNotifications,
  };

  // *able
  createdItem.taggable = Boolean(
    createdItem.lockable ||
      createdItem.classified ||
      itemDef.itemSubType === DestinyItemSubType.Shader ||
      createdItem.itemCategoryHashes.includes(ItemCategoryHashes.Mods_Mod)
  );
  createdItem.comparable = Boolean(
    createdItem.equipment &&
      createdItem.lockable &&
      createdItem.bucket.hash !== BucketHashes.Emblems
  );

  if (createdItem.primaryStat) {
    const statDef = defs.Stat.get(createdItem.primaryStat.statHash);
    createdItem.primaryStat.stat = statDef;
  }

  if (extendedICH[createdItem.hash]) {
    createdItem.itemCategoryHashes = [
      ...createdItem.itemCategoryHashes,
      extendedICH[createdItem.hash],
    ];
    // Masks are helmets too
    if (extendedICH[createdItem.hash] === ItemCategoryHashes.Mask) {
      createdItem.itemCategoryHashes = [
        ...createdItem.itemCategoryHashes,
        ItemCategoryHashes.Helmets,
      ];
    }
  }

  try {
    const socketInfo = buildSockets(item, itemComponents, defs, itemDef);
    createdItem.sockets = socketInfo.sockets;
    createdItem.missingSockets = socketInfo.missingSockets;
  } catch (e) {
    errorLog('d2-stores', `Error building sockets for ${createdItem.name}`, item, itemDef, e);
    reportException('Sockets', e, { itemHash: item.itemHash });
  }

  createdItem.wishListEnabled = Boolean(createdItem.bucket.inWeapons && createdItem.sockets);

  // A crafted weapon with an enhanced intrinsic and two enhanced traits is masterworked
  // https://github.com/Bungie-net/api/issues/1662
  if (createdItem.crafted && createdItem.sockets) {
    const containsEnhancedIntrinsic = createdItem.sockets.allSockets.some(
      (s) => s.plugged && enhancedIntrinsics.has(s.plugged.plugDef.hash)
    );
    if (containsEnhancedIntrinsic && countEnhancedPerks(createdItem.sockets) >= 2) {
      createdItem.masterwork = true;
    }
  }

  // Extract weapon crafting info from the crafted socket but
  // before building stats because the weapon level affects stats.
  createdItem.craftedInfo = buildCraftedInfo(createdItem, defs);

  if (createdItem.crafted) {
    const craftedItemInstanceId = `${createdItem.hash}${createdItem.craftedInfo?.dateCrafted}`;
    createdItem.id = craftedItemInstanceId;
    createdItem.index = craftedItemInstanceId;
  }

  // Crafting pattern
  createdItem.patternUnlockRecord = buildPatternInfo(createdItem, itemDef, defs, profileRecords);

  // Deepsight Resonance
  createdItem.deepsightInfo = buildDeepsightInfo(createdItem);

  // Catalyst
  if (createdItem.isExotic && createdItem.bucket.inWeapons) {
    createdItem.catalystInfo = buildCatalystInfo(createdItem.hash, profileRecords);
  }

  try {
    createdItem.stats = buildStats(defs, createdItem, itemDef);
  } catch (e) {
    errorLog('d2-stores', `Error building stats for ${createdItem.name}`, item, itemDef, e);
    reportException('Stats', e, { itemHash: item.itemHash });
  }

  try {
    createdItem.objectives = buildObjectives(
      item,
      itemDef,
      itemComponents?.objectives?.data,
      defs,
      uninstancedItemObjectives
    );
  } catch (e) {
    errorLog('d2-stores', `Error building objectives for ${createdItem.name}`, item, itemDef, e);
    reportException('Objectives', e, { itemHash: item.itemHash });
  }

  if (itemDef.perks?.length) {
    const perks = itemDef.perks.filter(
      (p) =>
        p.perkVisibility === ItemPerkVisibility.Visible &&
        defs.SandboxPerk.get(p.perkHash)?.isDisplayable
    );
    if (perks.length) {
      createdItem.perks = perks;
    }
  }

  // Compute complete / completion percentage
  if (createdItem.objectives) {
    const length = createdItem.objectives.length;
    if (length > 0) {
      createdItem.complete = createdItem.objectives.every((o) => o.complete);
      createdItem.percentComplete = _.sumBy(createdItem.objectives, (objective) => {
        if (objective.completionValue) {
          const checkTrialsPassage = isTrialsPassage(createdItem.hash);
          // Only the "Wins" objective should count towards completion
          if (checkTrialsPassage && !isWinsObjective(objective.objectiveHash)) {
            return 0;
          }
          return (
            Math.min(1, (objective.progress || 0) / objective.completionValue) /
            (checkTrialsPassage ? 1 : length)
          );
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

  if (extendedBreaker[createdItem.hash]) {
    createdItem.breakerType = defs.BreakerType.get(extendedBreaker[createdItem.hash]);
  }

  if (itemDef.traitIds?.some((trait) => trait.startsWith('foundry.'))) {
    createdItem.foundry = itemDef.traitIds
      .filter((trait) => trait.startsWith('foundry.'))[0]
      .replace('_', '-'); // tex_mechanica
  }

  if (extendedFoundry[createdItem.hash]) {
    createdItem.foundry = extendedFoundry[createdItem.hash];
  }

  // linear fusion rifles always seem to contain the "fusion rifle" category as well.
  // it's a fascinating "did you know", but ultimately not useful to us, so we remove it
  // because we don't want to filter FRs and see LFRs
  if (createdItem.itemCategoryHashes.includes(ItemCategoryHashes.LinearFusionRifles)) {
    const fusionRifleLocation = createdItem.itemCategoryHashes.indexOf(
      ItemCategoryHashes.FusionRifle
    );
    fusionRifleLocation !== -1 && createdItem.itemCategoryHashes.splice(fusionRifleLocation, 1);
  }

  // Infusion
  const tier = itemDef.inventory ? defs.ItemTierType[itemDef.inventory.tierTypeHash] : null;
  createdItem.infusionFuel = Boolean(
    tier?.infusionProcess && itemDef.quality?.infusionCategoryHashes?.length
  );
  createdItem.infusable = createdItem.infusionFuel && isLegendaryOrBetter(createdItem);
  createdItem.infusionQuality = itemDef.quality || null;

  // Masterwork
  try {
    createdItem.masterworkInfo = buildMasterwork(createdItem, defs);
  } catch (e) {
    errorLog(
      'd2-stores',
      `Error building masterwork info for ${createdItem.name}`,
      item,
      itemDef,
      e
    );
    reportException('MasterworkInfo', e, { itemHash: item.itemHash });
  }

  try {
    buildPursuitInfo(createdItem, item, itemDef);
  } catch (e) {
    errorLog('d2-stores', `Error building Quest info for ${createdItem.name}`, item, itemDef, e);
    reportException('Quest', e, { itemHash: item.itemHash });
  }

  if (createdItem.primaryStat && lightStats.includes(createdItem.primaryStat.statHash)) {
    createdItem.power = createdItem.primaryStat.value;
  }

  createdItem.index = createItemIndex(createdItem);

  return createdItem;
}

function isLegendaryOrBetter(item: DimItem) {
  return item.tier === 'Legendary' || item.tier === 'Exotic';
}

function buildPursuitInfo(
  createdItem: DimItem,
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
      modifierHashes: [],
    };
  }
  const rewards = itemDef.value ? itemDef.value.itemValue.filter((v) => v.itemHash) : [];
  if (rewards.length) {
    createdItem.pursuit = {
      suppressExpirationWhenObjectivesComplete: false,
      modifierHashes: [],
      ...createdItem.pursuit,
      rewards,
    };
  }
  if (
    createdItem.pursuit &&
    createdItem.bucket.hash === BucketHashes.Quests &&
    itemDef.setData?.itemList
  ) {
    createdItem.pursuit = {
      ...createdItem.pursuit,
      questLineDescription: itemDef.setData.questLineDescription,
      questStepNum: itemDef.setData.itemList.findIndex((i) => i.itemHash === itemDef.hash) + 1,
      questStepsTotal: itemDef.setData.itemList.length,
    };
  }
}
