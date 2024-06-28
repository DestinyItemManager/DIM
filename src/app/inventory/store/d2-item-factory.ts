import { CustomStatDef } from '@destinyitemmanager/dim-api-types';
import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { t } from 'app/i18next-t';
import { createCollectibleFinder } from 'app/records/collectible-matching';
import {
  D2ItemTiers,
  SOME_OTHER_DUMMY_BUCKET,
  THE_FORBIDDEN_BUCKET,
  d2MissingIcon,
  uniqueEquipBuckets,
} from 'app/search/d2-known-values';
import { lightStats } from 'app/search/search-filter-values';
import { getDamageDefsByDamageType } from 'app/utils/definitions';
import { emptyArray, emptyObject } from 'app/utils/empty';
import { errorLog, warnLog } from 'app/utils/log';
import { countEnhancedPerks } from 'app/utils/socket-utils';
import {
  BucketCategory,
  ComponentPrivacySetting,
  DestinyAmmunitionType,
  DestinyClass,
  DestinyDisplayPropertiesDefinition,
  DestinyInventoryItemDefinition,
  DestinyItemComponent,
  DestinyItemComponentSetOfint64,
  DestinyItemInstanceComponent,
  DestinyItemResponse,
  DestinyItemSubType,
  DestinyItemTooltipNotification,
  DestinyObjectiveProgress,
  DestinyProfileResponse,
  DestinyVendorSaleItemComponent,
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
import { Draft } from 'immer';
import _ from 'lodash';
import memoizeOne from 'memoize-one';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions';
import { reportException } from '../../utils/sentry';
import { InventoryBuckets } from '../inventory-buckets';
import { DimItem, DimPursuitExpiration, DimQuestLine } from '../item-types';
import { DimStore } from '../store-types';
import { getVault } from '../stores-helpers';
import { buildCatalystInfo } from './catalyst';
import { buildCraftedInfo } from './crafted';
import { buildDeepsightInfo } from './deepsight';
import { createItemIndex } from './item-index';
import { buildMasterwork } from './masterwork';
import { buildObjectives, isTrialsPassage, isWinsObjective } from './objectives';
import { buildPatternInfo } from './patterns';
import { buildSockets } from './sockets';
import { buildStats } from './stats';

const TAG = 'd2-stores';

const collectiblesByItemHash = memoizeOne(
  (Collectible: ReturnType<D2ManifestDefinitions['Collectible']['getAll']>) =>
    _.keyBy(Collectible, (c) => c.itemHash),
);

/**
 * Process an entire list of items into DIM items.
 */
export function processItems(
  context: ItemCreationContext,
  owner: DimStore,
  items: DestinyItemComponent[],
): DimItem[] {
  const result: DimItem[] = [];

  for (const item of items) {
    let createdItem: DimItem | undefined;
    try {
      createdItem = makeItem(context, item, owner);
    } catch (e) {
      errorLog(TAG, 'Error processing item', item, e);
      reportException('Processing Dim item', e);
    }
    if (
      createdItem !== undefined &&
      // we want to allow makeItem to generate dummy items. they're useful in vendors, as consumables, etc.
      // but processItems is for building stores, and we don't want dummy weapons or armor,
      // which can invisibly interfere with allItems calculations and measurements
      createdItem.location.hash !== THE_FORBIDDEN_BUCKET &&
      createdItem.location.hash !== SOME_OTHER_DUMMY_BUCKET
    ) {
      createdItem.owner = owner.id;
      result.push(createdItem);
    } else {
      // the item failed to be created for some reason. 2 things can currently cause this:
      // an exception occurred, or the item lacks a definition
      // not all of these should cause the store to consider itself hadErrors.
      // dummies and invisible items are not a big deal
      const defs = context.defs;
      const bucketDef = defs.InventoryBucket.get(item.bucketHash);
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

export const getClassTypeNameLocalized = memoizeOne((defs: D2ManifestDefinitions) =>
  _.memoize((type: DestinyClass): string => {
    const klass = Object.values(defs.Class.getAll()).find((c) => c.classType === type);
    if (klass) {
      return klass.displayProperties.name;
    } else {
      return t('Loadouts.Any');
    }
  }),
);

/** Make a "fake" item from other information - used for Collectibles, etc. */
export function makeFakeItem(
  context: ItemCreationContext,
  itemHash: number,
  {
    itemInstanceId = '0',
    quantity = 1,
    allowWishList = false,
    itemValueVisibility,
  }: {
    itemInstanceId?: string;
    quantity?: number;
    allowWishList?: boolean;
    /** if available, this should be passed in from a vendor saleItem (DestinyVendorSaleItemComponent) */
    itemValueVisibility?: DestinyVendorSaleItemComponent['itemValueVisibility'];
  } = emptyObject(),
): DimItem | undefined {
  const item = makeItem(
    context,
    {
      itemHash,
      itemInstanceId: itemInstanceId,
      quantity: quantity ?? 1,
      bindStatus: ItemBindStatus.NotBound,
      location: ItemLocation.Vendor,
      bucketHash: 0,
      transferStatus: TransferStatuses.NotTransferrable,
      itemValueVisibility,
      lockable: false,
      state: ItemState.None,
      isWrapper: false,
      tooltipNotificationIndexes: [],
      metricObjective: {} as DestinyObjectiveProgress,
      versionNumber: context.defs.InventoryItem.get(itemHash)?.quality?.currentVersion,
    },
    undefined,
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
  context: ItemCreationContext,
  itemResponse: DestinyItemResponse,
  stores: DimStore[],
): DimItem | undefined {
  if (!itemResponse.item.data) {
    return undefined;
  }

  const owner = itemResponse.characterId
    ? stores.find((s) => s.id === itemResponse.characterId)
    : getVault(stores);

  const itemId = itemResponse.item.data.itemInstanceId;

  // Convert a single component response into a dictionary component response
  const empty = { privacy: ComponentPrivacySetting.Public, data: {} };
  const m: <V>(v: SingleComponentResponse<V>) => DictionaryComponentResponse<V> = itemId
    ? (v) => (v ? { privacy: v.privacy, data: v.data ? { [itemId]: v.data } : {} } : empty)
    : () => empty;

  // We'll override our item components with these ones
  const itemComponents = {
    instances: m(itemResponse.instance),
    perks: m(itemResponse.perks),
    renderData: m(itemResponse.renderData),
    stats: m(itemResponse.stats),
    sockets: m(itemResponse.sockets),
    reusablePlugs: m(itemResponse.reusablePlugs),
    plugObjectives: m(itemResponse.plugObjectives),
    talentGrids: m(itemResponse.talentGrid),
    plugStates: empty,
    objectives: m(itemResponse.objectives),
  };

  // Make it look like a full response
  return makeItem({ ...context, itemComponents }, itemResponse.item.data, owner);
}

/**
 * Stuff that's required to create a DimItem.
 */
export interface ItemCreationContext {
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  profileResponse: DestinyProfileResponse;
  customStats: CustomStatDef[];
  /**
   * Sometimes comes from the profile response, but also sometimes from vendors response or mocked out.
   * If not present, the itemComponents from the DestinyProfileResponse should be used.
   */
  itemComponents?: Partial<DestinyItemComponentSetOfint64>;
}

/**
 * Process a single raw item into a DIM item.
 */
export function makeItem(
  { defs, buckets, itemComponents, customStats, profileResponse }: ItemCreationContext,
  item: DestinyItemComponent,
  /** the ID of the owning store - can be undefined for fake collections items */
  owner: DimStore | undefined,
): DimItem | undefined {
  if (owner) {
    // only makes sense to use the profile's itemComponents if it's a real item
    itemComponents ??= profileResponse.itemComponents;
  }

  const itemDef = defs.InventoryItem.get(item.itemHash);

  // Fish relevant data out of the profile.
  const profileRecords = profileResponse.profileRecords?.data;
  const characterRecords = profileResponse.characterRecords?.data;
  const characterProgressions =
    owner && !owner?.isVault ? profileResponse.characterProgressions?.data?.[owner.id] : undefined;

  const itemInstanceData: Partial<DestinyItemInstanceComponent> = item.itemInstanceId
    ? itemComponents?.instances?.data?.[item.itemInstanceId] ?? emptyObject()
    : emptyObject();

  // Missing definition
  if (!itemDef) {
    return undefined;
  }

  if (itemDef.redacted) {
    warnLog(
      'd2-stores',
      'Missing Item Definition:\n\n',
      { item, itemDef, itemInstanceData },
      '\n\nThis item is not in the current manifest and will be added at a later time by Bungie.',
    );
  }

  if (!(itemDef.displayProperties.name || itemDef.setData?.questLineName)) {
    if (item.itemHash === 3377778206) {
      // https://d2.destinygamewiki.com/wiki/Gift_of_the_Lighthouse
      (itemDef.displayProperties as Draft<DestinyDisplayPropertiesDefinition>).name =
        'Gift of the Lighthouse';
    } else {
      (itemDef.displayProperties as Draft<DestinyDisplayPropertiesDefinition>).name = '???';
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
  // The same thing can happen with mods and transmat effects (included in Mods)!
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
    normalBucket.hash === BucketHashes.Engrams ||
    itemDef.itemCategoryHashes?.includes(ItemCategoryHashes.Engrams) ||
    false;

  // https://github.com/Bungie-net/api/issues/134, class items had a primary stat

  let primaryStat: DimItem['primaryStat'] = null;
  if (
    itemInstanceData.primaryStat &&
    itemType !== 'Class' &&
    !itemDef.stats?.disablePrimaryStatDisplay
  ) {
    primaryStat = itemInstanceData.primaryStat;
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
    // Subclasses have their elemental damage type in the talent grid
    (normalBucket.hash === BucketHashes.Subclass &&
      itemDef.talentGrid?.hudDamageType !== undefined &&
      getDamageDefsByDamageType(defs)[itemDef.talentGrid.hudDamageType]) ||
    null;

  const hiddenOverlay = itemDef.iconWatermark;

  const tooltipNotifications = item.tooltipNotificationIndexes?.length
    ? item.tooltipNotificationIndexes
        // why the optional chain? well, somehow, an item can return tooltipNotificationIndexes,
        // but have no tooltipNotifications in its def
        .map((i) => itemDef.tooltipNotifications?.[i])
    : emptyArray<DestinyItemTooltipNotification>();

  // null out falsy values like a blank string for a url
  const iconOverlay =
    (item.versionNumber !== undefined &&
      itemDef.quality?.displayVersionWatermarkIcons?.[item.versionNumber]) ||
    itemDef.iconWatermark ||
    itemDef.iconWatermarkShelved ||
    undefined;

  const collectible = createCollectibleFinder(defs)(itemDef);
  // Do we need this now?
  const source = collectible?.sourceHash;

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
          DestinyClass.Classified
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
    itemCategoryHashes: getItemCategoryHashes(itemDef),
    tier: D2ItemTiers[itemDef.inventory!.tierType] || 'Common',
    isExotic: D2ItemTiers[itemDef.inventory!.tierType] === 'Exotic',
    name,
    description: displayProperties.description,
    icon: overrideStyleItem?.displayProperties.icon || displayProperties.icon || d2MissingIcon,
    hiddenOverlay,
    iconOverlay,
    secondaryIcon: overrideStyleItem?.secondaryIcon || itemDef.secondaryIcon || itemDef.screenshot,
    notransfer: Boolean(
      itemDef.nonTransferrable || item.transferStatus === TransferStatuses.NotTransferrable,
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
    classTypeNameLocalized: getClassTypeNameLocalized(defs)(itemDef.classType),
    element,
    energy: itemInstanceData.energy ?? null,
    lockable: itemType !== 'Finishers' ? item.lockable : true,
    trackable: Boolean(item.itemInstanceId && itemDef.objectives?.questlineItemHash),
    tracked: Boolean(item.state & ItemState.Tracked),
    locked: Boolean(item.state & ItemState.Locked),
    masterwork: Boolean(item.state & ItemState.Masterwork) && itemType !== 'Class',
    crafted: item.state & ItemState.Crafted ? 'crafted' : false,
    highlightedObjective: Boolean(item.state & ItemState.HighlightedObjective),
    classified: Boolean(itemDef.redacted),
    isEngram,
    loreHash: itemDef.loreHash,
    previewVendor: itemDef.preview?.previewVendorHash,
    ammoType: itemDef.equippingBlock ? itemDef.equippingBlock.ammoType : DestinyAmmunitionType.None,
    source,
    collectibleHash: collectible?.hash,
    missingSockets: false,
    displaySource: itemDef.displaySource,
    plug: itemDef.plug && {
      energyCost: itemDef.plug.energyCost?.energyCost || 0,
    },
    metricHash: item.metricHash,
    metricObjective: item.metricObjective,
    availableMetricCategoryNodeHashes: itemDef.metrics?.availableMetricCategoryNodeHashes,
    // These get filled in later
    breakerType: null,
    percentComplete: 0,
    hidePercentage: false,
    stats: null,
    objectives: undefined,
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
    infusionCategoryHashes: null,
    tooltipNotifications,
  };

  // *able
  createdItem.taggable = Boolean(
    createdItem.lockable ||
      createdItem.classified ||
      itemDef.itemSubType === DestinyItemSubType.Shader ||
      createdItem.itemCategoryHashes.includes(ItemCategoryHashes.Mods_Mod),
  );
  createdItem.comparable = Boolean(
    createdItem.equipment &&
      createdItem.lockable &&
      createdItem.bucket.hash !== BucketHashes.Emblems,
  );

  if (createdItem.primaryStat) {
    createdItem.primaryStatDisplayProperties = defs.Stat.get(
      createdItem.primaryStat.statHash,
    ).displayProperties;
  }

  try {
    const socketInfo = buildSockets(item, itemComponents, defs, itemDef);
    createdItem.sockets = socketInfo.sockets;
    createdItem.missingSockets = socketInfo.missingSockets;
  } catch (e) {
    errorLog(TAG, `Error building sockets for ${createdItem.name}`, item, itemDef, e);
    reportException('Sockets', e, { itemHash: item.itemHash });
  }

  createdItem.wishListEnabled = Boolean(
    createdItem.sockets &&
      (createdItem.bucket.inWeapons ||
        (createdItem.bucket.hash === BucketHashes.ClassArmor && createdItem.isExotic)),
  );

  // Extract weapon crafting info from the crafted socket but
  // before building stats because the weapon level affects stats.
  createdItem.craftedInfo = buildCraftedInfo(createdItem, defs);

  // Crafting pattern
  createdItem.patternUnlockRecord = buildPatternInfo(
    createdItem,
    itemDef,
    defs,
    profileRecords,
    characterRecords,
  );

  // don't worry, craftable weapons can't be enhanced
  if (createdItem.crafted && !createdItem.patternUnlockRecord) {
    createdItem.crafted = 'enhanced';
  }

  // Deepsight Resonance
  createdItem.deepsightInfo = buildDeepsightInfo(createdItem);

  // Catalyst
  if (createdItem.isExotic && createdItem.bucket.inWeapons) {
    createdItem.catalystInfo = buildCatalystInfo(
      createdItem.hash,
      profileRecords,
      profileResponse.characterRecords?.data,
    );
  }

  try {
    createdItem.stats = buildStats(defs, createdItem, customStats, itemDef);
  } catch (e) {
    errorLog(TAG, `Error building stats for ${createdItem.name}`, item, itemDef, e);
    reportException('Stats', e, { itemHash: item.itemHash });
  }

  try {
    const itemInstancedObjectives = item.itemInstanceId
      ? itemComponents?.objectives?.data?.[item.itemInstanceId]?.objectives
      : undefined;
    const uninstancedItemObjectives = characterProgressions?.uninstancedItemObjectives;
    const itemUninstancedObjectives = uninstancedItemObjectives?.[item.itemHash];

    createdItem.objectives = buildObjectives(
      itemDef,
      defs,
      itemInstancedObjectives,
      itemUninstancedObjectives,
    );
  } catch (e) {
    errorLog(TAG, `Error building objectives for ${createdItem.name}`, item, itemDef, e);
  }

  if (itemDef.perks?.length) {
    const uninstancedItemPerks = characterProgressions?.uninstancedItemPerks;
    const itemUninstancedPerks = uninstancedItemPerks?.[item.itemHash]?.perks;
    const perks = itemDef.perks.filter(
      (p, i) =>
        p.perkVisibility === ItemPerkVisibility.Visible &&
        itemUninstancedPerks?.[i]?.visible !== false &&
        defs.SandboxPerk.get(p.perkHash)?.isDisplayable,
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

  // a weapon can have an inherent breaker type, or gain one from socketed mods
  // (or armor mods can sort of add them but let's not go there quite yet)
  // this is presented as an else-type dichotomy here, but who knows what the future holds
  if (itemDef.breakerTypeHash) {
    createdItem.breakerType = defs.BreakerType.get(itemDef.breakerTypeHash);
  } else if (createdItem.bucket.inWeapons && createdItem.sockets) {
    const breakerTypeHash = createdItem.sockets.allSockets.find(
      (s) => s.plugged?.plugDef.breakerTypeHash,
    )?.plugged?.plugDef.breakerTypeHash;
    if (breakerTypeHash) {
      createdItem.breakerType = defs.BreakerType.get(breakerTypeHash);
    }
  }

  if (createdItem.hash in extendedBreaker) {
    createdItem.breakerType = defs.BreakerType.get(extendedBreaker[createdItem.hash]!);
  }

  // TODO: compute this on demand
  createdItem.foundry =
    extendedFoundry[createdItem.hash] ??
    itemDef.traitIds
      ?.find((trait) => trait.startsWith('foundry.'))
      // tex_mechanica
      ?.replace('_', '-')
      ?.replace('foundry.', '');

  // linear fusion rifles always seem to contain the "fusion rifle" category as well.
  // it's a fascinating "did you know", but ultimately not useful to us, so we remove it
  // because we don't want to filter FRs and see LFRs
  if (createdItem.itemCategoryHashes.includes(ItemCategoryHashes.LinearFusionRifles)) {
    const fusionRifleLocation = createdItem.itemCategoryHashes.indexOf(
      ItemCategoryHashes.FusionRifle,
    );
    fusionRifleLocation !== -1 && createdItem.itemCategoryHashes.splice(fusionRifleLocation, 1);
  }

  // Infusion
  createdItem.infusionFuel = Boolean(itemDef.quality?.infusionCategoryHashes?.length);
  createdItem.infusable = createdItem.infusionFuel && isLegendaryOrBetter(createdItem);
  createdItem.infusionCategoryHashes = itemDef.quality?.infusionCategoryHashes || null;

  // Masterwork
  try {
    createdItem.masterworkInfo = buildMasterwork(createdItem, defs);
  } catch (e) {
    errorLog(
      'd2-stores',
      `Error building masterwork info for ${createdItem.name}`,
      item,
      itemDef,
      e,
    );
    reportException('MasterworkInfo', e, { itemHash: item.itemHash });
  }

  // A crafted weapon with an enhanced intrinsic and two enhanced traits is masterworked
  // https://github.com/Bungie-net/api/issues/1662
  if (createdItem.crafted && createdItem.sockets) {
    const containsEnhancedIntrinsic = createdItem.sockets.allSockets.some(
      (s) => s.plugged && enhancedIntrinsics.has(s.plugged.plugDef.hash),
    );
    if (
      (containsEnhancedIntrinsic || createdItem.masterworkInfo?.tier === 10) &&
      countEnhancedPerks(createdItem.sockets) >= 2
    ) {
      createdItem.masterwork = true;
    }
  }

  try {
    buildPursuitInfo(createdItem, item, itemDef);
  } catch (e) {
    errorLog(TAG, `Error building Quest info for ${createdItem.name}`, item, itemDef, e);
    if (e instanceof Error) {
      reportException('Quest', e, { itemHash: item.itemHash });
    }
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

function getQuestLineInfo(itemDef: DestinyInventoryItemDefinition): DimQuestLine | undefined {
  if (itemDef.inventory?.bucketTypeHash === BucketHashes.Quests && itemDef.setData?.itemList) {
    const thisStepIndex = itemDef.setData.itemList.findIndex((i) => i.itemHash === itemDef.hash);
    if (thisStepIndex !== -1) {
      return {
        description: itemDef.setData.questLineDescription,
        questStepNum: thisStepIndex + 1,
        questStepsTotal: itemDef.setData.itemList.length,
      };
    }
  }
}

function getExpirationInfo(
  item: DestinyItemComponent,
  itemDef: DestinyInventoryItemDefinition,
): DimPursuitExpiration | undefined {
  if (item.expirationDate) {
    return {
      expirationDate: new Date(item.expirationDate),
      suppressExpirationWhenObjectivesComplete: Boolean(
        itemDef.inventory!.suppressExpirationWhenObjectivesComplete,
      ),
      expiredInActivityMessage: itemDef.inventory!.expiredInActivityMessage,
    };
  }
}

function buildPursuitInfo(
  createdItem: DimItem,
  item: DestinyItemComponent,
  itemDef: DestinyInventoryItemDefinition,
) {
  const rewards = itemDef.value
    ? itemDef.value.itemValue.filter(
        (v, i) => v.itemHash && (item.itemValueVisibility?.[i] ?? true),
      )
    : [];

  const questLine = getQuestLineInfo(itemDef);
  const expiration = getExpirationInfo(item, itemDef);

  if (rewards.length || item.expirationDate || questLine) {
    createdItem.pursuit = {
      expiration,
      questLine,
      rewards,
      modifierHashes: [],
    };
  }
}

function getItemCategoryHashes(itemDef: DestinyInventoryItemDefinition): number[] {
  let itemCategoryHashes = itemDef.itemCategoryHashes || emptyArray();

  if (
    itemCategoryHashes.includes(ItemCategoryHashes.Weapon) &&
    !itemCategoryHashes.includes(ItemCategoryHashes.Dummies)
  ) {
    if (
      itemCategoryHashes.includes(ItemCategoryHashes.GrenadeLaunchers) &&
      !itemCategoryHashes.includes(ItemCategoryHashes.PowerWeapon)
    ) {
      // Special grenade launchers
      itemCategoryHashes = [
        // Special grenade launchers are not heavy grenade launchers
        ...itemCategoryHashes.filter((ich) => ich !== ItemCategoryHashes.GrenadeLaunchers),
        -ItemCategoryHashes.GrenadeLaunchers,
      ];
    }

    if (itemDef.hash in extendedICH) {
      const additionalICH = extendedICH[itemDef.hash]!;
      itemCategoryHashes = [...itemCategoryHashes, additionalICH];

      // Masks are helmets too
      if (additionalICH === ItemCategoryHashes.Mask) {
        itemCategoryHashes = [...itemCategoryHashes, ItemCategoryHashes.Helmets];
      }
    }
  }

  return itemCategoryHashes;
}
