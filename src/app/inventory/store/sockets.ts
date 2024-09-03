import { getCraftingTemplate } from 'app/armory/crafting-utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  GhostActivitySocketTypeHashes,
  weaponMasterworkY2SocketTypeHash,
} from 'app/search/d2-known-values';
import { filterMap } from 'app/utils/collections';
import { compareBy } from 'app/utils/comparators';
import { emptyArray } from 'app/utils/empty';
import {
  eventArmorRerollSocketIdentifiers,
  isEnhancedPerk,
  subclassAbilitySocketCategoryHashes,
} from 'app/utils/socket-utils';
import {
  DestinyInventoryItemDefinition,
  DestinyItemComponent,
  DestinyItemComponentSetOfint64,
  DestinyItemPlugBase,
  DestinyItemSocketEntryDefinition,
  DestinyItemSocketEntryPlugItemRandomizedDefinition,
  DestinyItemSocketState,
  DestinyObjectiveProgress,
  DestinyPlugItemCraftingRequirements,
  DestinySocketCategoryStyle,
  DestinySocketTypeDefinition,
  SocketPlugSources,
} from 'bungie-api-ts/destiny2';
import deprecatedMods from 'data/d2/deprecated-mods.json';
import { emptyPlugHashes } from 'data/d2/empty-plug-hashes';
import {
  BucketHashes,
  ItemCategoryHashes,
  PlugCategoryHashes,
  SocketCategoryHashes,
} from 'data/d2/generated-enums';
import perkToEnhanced from 'data/d2/trait-to-enhanced-trait.json';
import _ from 'lodash';
import {
  DimItem,
  DimPlug,
  DimPlugSet,
  DimSocket,
  DimSocketCategory,
  DimSockets,
  PluggableInventoryItemDefinition,
} from '../item-types';
import { exoticClassItemPlugs } from './exotic-class-item';

//
// These are the utilities that deal with Sockets and Plugs on items. Sockets and Plugs
// are how perks, mods, and many other things are implemented on items.
//
// This is called from within d2-item-factory.service.ts
//

const enhancedToPerk = _.mapValues(_.invert(perkToEnhanced), (s) => Number(s));

/**
 * Calculate all the sockets we want to display (or make searchable). Sockets represent perks,
 * mods, and intrinsic properties of the item. They're really the swiss army knife of item
 * customization.
 */
export function buildSockets(
  item: DestinyItemComponent,
  itemComponents: Partial<DestinyItemComponentSetOfint64> | undefined,
  defs: D2ManifestDefinitions,
  itemDef: DestinyInventoryItemDefinition,
): { sockets: DimItem['sockets']; missingSockets: DimItem['missingSockets'] } {
  let sockets: DimSockets | null = null;
  if ($featureFlags.simulateMissingSockets) {
    itemComponents = undefined;
  }

  const socketData =
    (item.itemInstanceId && itemComponents?.sockets?.data?.[item.itemInstanceId]?.sockets) ||
    undefined;
  const reusablePlugData =
    (item.itemInstanceId && itemComponents?.reusablePlugs?.data?.[item.itemInstanceId]?.plugs) ||
    undefined;
  const plugObjectivesData =
    (item.itemInstanceId &&
      itemComponents?.plugObjectives?.data?.[item.itemInstanceId]?.objectivesPerPlug) ||
    undefined;

  if (socketData) {
    sockets = buildInstancedSockets(
      defs,
      itemDef,
      item,
      socketData,
      reusablePlugData,
      plugObjectivesData,
    );
  }

  // If we didn't have live data (for example, when viewing vendor items or collections),
  // get sockets from the item definition.
  if (!sockets && itemDef.sockets) {
    // a nice long instanceId is a real one and "should" have this data
    // (short is actually a vendor item index. we'll let that build from defs.)
    const isInstanced = Boolean(item.itemInstanceId && item.itemInstanceId.length > 14);

    // If this really *should* have live sockets, but didn't...
    if (item.itemInstanceId !== '0' && !socketData) {
      return { sockets: null, missingSockets: isInstanced ? 'missing' : 'not-loaded' };
    }

    sockets = buildDefinedSockets(defs, itemDef);
  }

  return { sockets, missingSockets: false };
}

/**
 * Build sockets that come from the live instance.
 */
function buildInstancedSockets(
  defs: D2ManifestDefinitions,
  itemDef: DestinyInventoryItemDefinition,
  item: DestinyItemComponent,
  sockets?: DestinyItemSocketState[],
  reusablePlugData?: {
    [key: number]: DestinyItemPlugBase[];
  },
  plugObjectivesData?: {
    [key: number]: DestinyObjectiveProgress[];
  },
): DimSockets | null {
  if (!item.itemInstanceId || !itemDef.sockets?.socketEntries.length || !sockets?.length) {
    return null;
  }

  const createdSockets: DimSocket[] = [];
  for (let i = 0; i < sockets.length; i++) {
    const built = buildSocket(
      defs,
      sockets[i],
      itemDef.sockets.socketEntries[i],
      i,
      reusablePlugData?.[i],
      plugObjectivesData,
      itemDef,
    );

    // There are a bunch of garbage sockets that we ignore
    if (built) {
      createdSockets.push(built);
    }
  }

  const categories: DimSocketCategory[] = [];

  for (const category of itemDef.sockets.socketCategories) {
    categories.push({
      category: defs.SocketCategory.get(category.socketCategoryHash, itemDef),
      socketIndexes: category.socketIndexes,
    });
  }

  return {
    allSockets: createdSockets, // Flat list of sockets
    categories:
      itemDef.inventory?.bucketTypeHash === BucketHashes.Subclass
        ? categories.sort(compareBy((c) => c.category?.index))
        : categories, // Sockets organized by category
  };
}

/**
 * Build sockets that come from only the definition. We won't be able to tell which ones are selected.
 */
function buildDefinedSockets(
  defs: D2ManifestDefinitions,
  itemDef: DestinyInventoryItemDefinition,
): DimSockets | null {
  // if we made it here, item has sockets
  const socketDefEntries = itemDef.sockets!.socketEntries;
  if (!socketDefEntries?.length) {
    return null;
  }
  const craftingTemplateSockets = getCraftingTemplate(defs, itemDef.hash)?.sockets!.socketEntries;
  const createdSockets: DimSocket[] = [];
  // TODO: check out intrinsicsockets as well

  for (let i = 0; i < socketDefEntries.length; i++) {
    const socketDef = socketDefEntries[i];
    const built = buildDefinedSocket(
      defs,
      socketDef,
      i,
      craftingTemplateSockets?.[i]?.reusablePlugSetHash,
      itemDef,
    );

    // There are a bunch of garbage sockets that we ignore
    if (built) {
      createdSockets.push(built);
    }
  }

  const categories: DimSocketCategory[] = [];

  for (const category of itemDef.sockets!.socketCategories) {
    categories.push({
      category: defs.SocketCategory.get(category.socketCategoryHash),
      socketIndexes: category.socketIndexes,
    });
  }

  return {
    allSockets: createdSockets, // Flat list of sockets
    categories:
      itemDef.inventory?.bucketTypeHash === BucketHashes.Subclass
        ? categories.sort(compareBy((c) => c.category?.index))
        : categories, // Sockets organized by category
  };
}

function filterReusablePlug(reusablePlug: DimPlug) {
  return (
    !reusablePlug.plugDef.itemCategoryHashes?.some(
      (ich) =>
        ich === ItemCategoryHashes.MasterworksMods ||
        ich === ItemCategoryHashes.GhostModsProjections,
    ) && !reusablePlug.plugDef.plug?.plugCategoryIdentifier.includes('masterworks.stat')
  );
}

/**
 * Some craftable items have perks that can no longer roll, but the enhanced
 * version of those perks still shows up in the list and claims to be roll-able.
 * This helps us filter them out.
 */
function isUncraftableEnhancedPerk(
  built: DimPlug,
  craftingRequirements: DestinyPlugItemCraftingRequirements | undefined,
) {
  return (
    isEnhancedPerk(built.plugDef) &&
    craftingRequirements &&
    craftingRequirements.unlockRequirements.length === 0 &&
    craftingRequirements.materialRequirementHashes.length === 0
  );
}

/**
 * Build a socket from definitions, without the benefit of live profile info.
 */
function buildDefinedSocket(
  defs: D2ManifestDefinitions,
  socketDef: DestinyItemSocketEntryDefinition,
  index: number,
  craftingReusablePlugSetHash: number | undefined,
  forThisItem?: DestinyInventoryItemDefinition,
): DimSocket | undefined {
  if (!socketDef) {
    return undefined;
  }
  // a LOT of sockets have socketTypeHash "0", no subsequent data, and should be excluded from consideration
  const socketTypeDef =
    socketDef.socketTypeHash && defs.SocketType.get(socketDef.socketTypeHash, forThisItem);
  if (!socketTypeDef) {
    return undefined;
  }
  const socketCategoryDef = defs.SocketCategory.get(socketTypeDef.socketCategoryHash, forThisItem);
  if (!socketCategoryDef) {
    return undefined;
  }

  const isReusable = socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Reusable;
  // This covers the visible intrinsic perks and armor stat plugs,
  // for all of which everything but the currently plugged thing are distractions
  const isIntrinsic = socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.LargePerk;

  // Is this socket a perk-style socket, or something more general (mod-like)?
  const isPerk =
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Unlockable ||
    isIntrinsic ||
    isReusable;
  const isMod =
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Consumable ||
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Abilities;

  // The currently equipped plug, if any
  const reusablePlugs: DimPlug[] = [];

  let craftingData: DimSocket['craftingData'];
  function addCraftingReqs(plugEntry: DestinyItemSocketEntryPlugItemRandomizedDefinition) {
    if (
      plugEntry.craftingRequirements &&
      (plugEntry.craftingRequirements.materialRequirementHashes.length ||
        plugEntry.craftingRequirements.unlockRequirements.length)
    ) {
      (craftingData ??= {})[plugEntry.plugItemHash] = plugEntry.craftingRequirements;
    }
  }

  // We only build a larger list of plug options if this is a perk socket, since users would
  // only want to see (and search) the plug options for perks. For other socket types (mods, shaders, etc.)
  // we will only populate plugOptions with the currently inserted plug.
  if (isPerk && !isIntrinsic) {
    if (socketDef.reusablePlugSetHash) {
      const plugSet = defs.PlugSet.get(socketDef.reusablePlugSetHash, forThisItem);
      if (plugSet) {
        for (const reusablePlug of plugSet.reusablePlugItems) {
          const built = buildDefinedPlug(
            defs,
            reusablePlug.plugItemHash,
            reusablePlug.currentlyCanRoll,
          );

          if (built && !isUncraftableEnhancedPerk(built, reusablePlug.craftingRequirements)) {
            reusablePlugs.push(built);
            addCraftingReqs(reusablePlug);
          }
        }
      }
    } else if (socketDef.randomizedPlugSetHash) {
      const craftingPlugSetItems = craftingReusablePlugSetHash
        ? defs.PlugSet.get(craftingReusablePlugSetHash, forThisItem).reusablePlugItems
        : [];
      const randomizedPlugSetItems =
        defs.PlugSet.get(socketDef.randomizedPlugSetHash, forThisItem)?.reusablePlugItems ?? [];
      // if they're available, process crafted plugs first, because they have level requirements attached
      // then process things from the randomizedPlugSetItems (can include retired perks)
      // this would duplicate some plug options, but they are uniqued in a for loop a few lines below
      // and first (crafted) is preferred in the uniquing
      const plugSetItems = [...craftingPlugSetItems, ...randomizedPlugSetItems];
      if (plugSetItems.length) {
        // Unique the plugs by hash, but also consider the perk rollable if there's a copy with currentlyCanRoll = true
        // See https://github.com/DestinyItemManager/DIM/issues/7272
        // We use a Map to preserve insertion order - an object would return its values sorted by hash!
        const plugs = new Map<number, DestinyItemSocketEntryPlugItemRandomizedDefinition>();
        for (const randomPlug of plugSetItems) {
          const existing = plugs.get(randomPlug.plugItemHash);
          if (!existing || (!existing.currentlyCanRoll && randomPlug.currentlyCanRoll)) {
            plugs.set(randomPlug.plugItemHash, randomPlug);
          }
        }

        for (const randomPlug of plugs.values()) {
          const built = buildDefinedPlug(
            defs,
            randomPlug.plugItemHash,
            randomPlug.currentlyCanRoll,
          );

          // we don't want "stat roll" plugs to count as reusablePlugs, but they're almost
          // indistinguishable from exotic intrinsic armor perks, so we stop them here based
          // on the fact that they have no name
          if (
            built?.plugDef.displayProperties.name &&
            !isUncraftableEnhancedPerk(built, randomPlug.craftingRequirements)
          ) {
            reusablePlugs.push(built);
            addCraftingReqs(randomPlug);
          }
        }
      }
    } else if (socketDef.reusablePlugItems && socketDef.reusablePlugItems.length > 0) {
      for (const reusablePlug of socketDef.reusablePlugItems) {
        const built = buildDefinedPlug(defs, reusablePlug.plugItemHash);
        if (built) {
          reusablePlugs.push(built);
        }
      }
    } else if (
      forThisItem &&
      forThisItem.hash in exoticClassItemPlugs &&
      index in exoticClassItemPlugs[forThisItem.hash]!
    ) {
      const plugs = exoticClassItemPlugs[forThisItem.hash]![index]!;
      for (const plugItemHash of plugs) {
        const built = buildDefinedPlug(defs, plugItemHash);
        if (built) {
          reusablePlugs.push(built);
        }
      }
    } else if (socketDef.singleInitialItemHash) {
      const built = buildDefinedPlug(defs, socketDef.singleInitialItemHash);
      if (built) {
        reusablePlugs.push(built);
      }
    }
  }

  if (
    socketDef.singleInitialItemHash &&
    !reusablePlugs.find((rp) => rp.plugDef.hash === socketDef.singleInitialItemHash)
  ) {
    const built = buildDefinedPlug(defs, socketDef.singleInitialItemHash);
    if (built) {
      reusablePlugs.push({
        ...built,
        unreliablePerkOption: reusablePlugs.length > 0,
      });
    }
  }

  const plugOptions: DimPlug[] = [];

  if (reusablePlugs.length) {
    for (const reusablePlug of reusablePlugs) {
      if (filterReusablePlug(reusablePlug)) {
        plugOptions.push(reusablePlug);
      }
    }
  }
  // Plugs are already in the right order from the plugset, but some weapons
  // have retired/collections perks in the middle of the list so we sort them
  // down. Sort is stable so the existing crafting-cost-order will be preserved.
  plugOptions.sort(
    compareBy((p: DimPlug) =>
      // shove retired perks to the bottom (our choice)
      p.cannotCurrentlyRoll
        ? 999
        : // And collections rolls almost as far
          p.unreliablePerkOption
          ? 998
          : 0,
    ),
  );
  // If the socket category is the intrinsic trait, assume that there is only one option and plug it.
  let plugged: DimPlug | null = null;
  if (
    plugOptions.length === 1 &&
    // this covers weapon intrinsices
    (socketCategoryDef.hash === SocketCategoryHashes.IntrinsicTraits ||
      // this covers exotic armor perks and stats
      plugOptions[0].plugDef.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics)
  ) {
    plugged = plugOptions[0];
  }

  const plugSet = socketDef.reusablePlugSetHash
    ? buildCachedDimPlugSet(defs, socketDef.reusablePlugSetHash)
    : socketDef.randomizedPlugSetHash
      ? buildCachedDimPlugSet(defs, socketDef.randomizedPlugSetHash)
      : undefined;

  return {
    socketIndex: index,
    plugged,
    plugOptions,
    plugSet,
    emptyPlugItemHash: findEmptyPlug(socketDef, socketTypeDef, plugSet),
    reusablePlugItems: emptyArray(),
    hasRandomizedPlugItems:
      Boolean(socketDef.randomizedPlugSetHash) || socketTypeDef.alwaysRandomizeSockets,
    isPerk,
    isReusable,
    isMod,
    socketDefinition: socketDef,
    craftingData,
  };
}

/**
 * verifies a DestinyInventoryItemDefinition is pluggable into a socket
 * and converts it to a PluggableInventoryItemDefinition
 */
export function isPluggableItem(
  itemDef?: DestinyInventoryItemDefinition,
): itemDef is PluggableInventoryItemDefinition {
  return itemDef?.plug !== undefined;
}

/**
 * Converts a list of item hashes to PluggableInventoryItemDefinitions (filtering out ones that aren't plugs)
 */
export function hashesToPluggableItems(
  defs: D2ManifestDefinitions,
  hashes: number[],
): PluggableInventoryItemDefinition[] {
  return hashes.map((hash) => defs.InventoryItem.get(hash)).filter(isPluggableItem);
}

function isDestinyItemPlug(
  plug: DestinyItemPlugBase | DestinyItemSocketState,
): plug is DestinyItemPlugBase {
  return 'plugItemHash' in plug;
}

function buildPlug(
  defs: D2ManifestDefinitions,
  plug: DestinyItemPlugBase | DestinyItemSocketState,
  plugObjectivesData:
    | {
        [plugItemHash: number]: DestinyObjectiveProgress[];
      }
    | undefined,
  plugSet: DimPlugSet | undefined,
): DimPlug | null {
  const destinyItemPlug = isDestinyItemPlug(plug);
  const plugHash = destinyItemPlug ? plug.plugItemHash : plug.plugHash;

  if (!plugHash) {
    return null;
  }

  const plugDef = defs.InventoryItem.get(plugHash);
  if (!plugDef || !isPluggableItem(plugDef)) {
    return null;
  }

  // These are almost never present
  const failReasons = plug.enableFailIndexes
    ? filterMap(
        plug.enableFailIndexes,
        (index) => plugDef.plug.enabledRules[index]?.failureMessage,
      ).join('\n')
    : '';

  const enabled = destinyItemPlug ? plug.enabled : plug.isEnabled;
  const unenhancedVersion = enhancedToPerk[plugDef.hash];
  return {
    plugDef,
    enabled: enabled && (!destinyItemPlug || plug.canInsert),
    enableFailReasons: failReasons,
    plugObjectives: plugObjectivesData?.[plugHash] || emptyArray(),
    stats: null,
    cannotCurrentlyRoll:
      plugSet?.plugHashesThatCannotRoll.includes(plugDef.hash) &&
      !plugSet?.plugHashesThatCanRoll.includes(unenhancedVersion),
  };
}

export function buildDefinedPlug(
  defs: D2ManifestDefinitions,
  plugHash: number,
  currentlyCanRoll?: boolean,
): DimPlug | null {
  const plugDef = plugHash && defs.InventoryItem.get(plugHash);
  if (!plugDef || !isPluggableItem(plugDef)) {
    return null;
  }

  return {
    plugDef,
    enabled: true,
    enableFailReasons: '',
    plugObjectives: emptyArray(),
    stats: null,
    cannotCurrentlyRoll: currentlyCanRoll === false,
  };
}

function isKnownEmptyPlugItemHash(plugItemHash: number) {
  return emptyPlugHashes.has(plugItemHash);
}

// These socket categories never have any empty-able sockets.
const noDefaultSocketCategoryHashes: SocketCategoryHashes[] = [
  ...subclassAbilitySocketCategoryHashes,
  SocketCategoryHashes.WeaponPerks_Reusable,
  SocketCategoryHashes.IntrinsicTraits,
  SocketCategoryHashes.ArmorPerks_LargePerk,
  SocketCategoryHashes.ArmorPerks_Reusable,
  SocketCategoryHashes.ArmorTier,
  SocketCategoryHashes.GhostTier,
  SocketCategoryHashes.ClanPerks_Unlockable_ClanBanner,
  SocketCategoryHashes.GhostShellPerks,
  SocketCategoryHashes.VehiclePerks,
];

// Because we conservatively fall back to `singleInitialItemHash`, we
// may misinterpret some `singleInitialItemHash`es as the empty plug.
// If this list gets too large, consider removing the `singleInitialItemHash` fallback,
// because it's really just a concession to the fact that D2AI can't ever be 100% complete.
const noDefaultPlugIdentifiers: (string | number)[] = [
  'enhancements.exotic', // Exotic Armor Perk sockets (Aeons, all options are equivalent)
  'enhancements.artifice.exotic', // This is the dummy "upgrade this armor to artifice" socket
  ...eventArmorRerollSocketIdentifiers, // Weird rerolling sockets
  PlugCategoryHashes.ArmorSkinsSharedHead, // FotL Helmet Ornaments
];

/**
 * DIM sometimes wants to know whether a plug is the "empty" plug so that
 * it knows not to record an override, or it may choose to reset a socket
 * back to empty to free up mod space, or it may wish to distinguish the
 * empty plug in UI sorting. However there's no easy, manifest-driven way
 * to figure out whether an empty plug exists and if so, what it is.
 *
 * The closest thing is the singleInitialItemHash, and that works for many
 * mod sockets, but it's insufficient in some cases (non-exhaustive):
 *
 * 1. The socket may not have a singleInitialItemHash. Artifice artifact mod
 *    slots don't reference any plug in singleInitialItemHash, and the first
 *    entry in the plug set just so happened to be the empty plug.
 * 2. The socket's singleInitialItemHash may reference a non-empty plug. A lot
 *    of armor references associated shaders here instead.
 * 3. The singleInitialItemHash is an empty plug, but it's not the proper empty
 *    plug. This happens to void subclass aspect and fragment sockets, and is
 *    really insidious because void subclasses start with these sockets but these
 *    plugs can never be inserted, so we can't use it.
 */
function findEmptyPlug(
  socket: DestinyItemSocketEntryDefinition,
  socketType: DestinySocketTypeDefinition,
  plugSet: DimPlugSet | undefined,
  reusablePlugs?: DestinyItemPlugBase[],
) {
  // First, perform some filtering, both for efficiency and to explicitly
  // leave emptyPlugItemHash set to undefined for sockets that never have
  // an empty plug, like abilities etc.

  if (
    // Sockets that ONLY get their items from your inventory necessarily can't be emptied
    ((socket.plugSources & ~SocketPlugSources.InventorySourced) === 0 &&
      socket.socketTypeHash !== GhostActivitySocketTypeHashes.Locked) ||
    // Y2+ weapon masterworks don't have an "empty" entry.
    socket.socketTypeHash === weaponMasterworkY2SocketTypeHash ||
    // Socket categories that have no empty plug
    noDefaultSocketCategoryHashes.includes(socketType.socketCategoryHash)
  ) {
    return undefined;
  }

  if (
    socketType.plugWhitelist.some((whiteListEntry) =>
      noDefaultPlugIdentifiers.some((id) =>
        typeof id === 'number'
          ? whiteListEntry.categoryHash === id
          : whiteListEntry.categoryIdentifier.startsWith(id),
      ),
    )
  ) {
    return undefined;
  }

  // Sometimes the empty plug is a regular plug set entry, sometimes it's one
  // of the reusablePlugItems. However, reusablePlugItems is thrown away when
  // there's a PlugSet, so we check the live API response reusablePlugs instead
  // if available. This is insufficient for shaders on blue items because
  // neither the API response nor the plugSet have the empty shader.
  // FIXME #7793: Retain socket.reusablePlugItems when it has unique items
  // and evaluate whether checking live API response is still necessary
  const empty =
    reusablePlugs?.find((p) => isKnownEmptyPlugItemHash(p.plugItemHash))?.plugItemHash ||
    plugSet?.precomputedEmptyPlugItemHash ||
    socket.reusablePlugItems.find((p) => isKnownEmptyPlugItemHash(p.plugItemHash))?.plugItemHash;

  // Falling back to singleInitialItemHash is the conservative choice:
  // 1. Before this function existed, we used singleInitialItemHash all the
  //    time and it only broke in specific situations, so we might as well
  //    continue using it when we didn't find a better plug before.
  // 2. The game has a lot of sockets and we don't want to be updating
  //    D2AI every time a new socket appears -- better to just fix either
  //    the filters above or the D2AI list when something breaks.
  //
  // If there's a very good reason to assume a socket can't be emptied, filter it above.
  return empty ?? (socket.singleInitialItemHash || undefined);
}

/**
 * Build information about an individual socket, and its plugs, using live information.
 */
function buildSocket(
  defs: D2ManifestDefinitions,
  socket: DestinyItemSocketState,
  socketDef: DestinyItemSocketEntryDefinition | undefined,
  index: number,
  reusablePlugs?: DestinyItemPlugBase[],
  plugObjectivesData?: {
    [plugItemHash: number]: DestinyObjectiveProgress[];
  },
  forThisItem?: DestinyInventoryItemDefinition,
): DimSocket | undefined {
  if (!socketDef?.socketTypeHash) {
    return undefined;
  }

  const socketTypeDef = defs.SocketType.get(socketDef.socketTypeHash, forThisItem);
  if (!socketTypeDef) {
    return undefined;
  }
  const socketCategoryDef = defs.SocketCategory.get(socketTypeDef.socketCategoryHash, forThisItem);
  if (!socketCategoryDef) {
    return undefined;
  }

  const isReusable = socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Reusable;
  // This covers the visible intrinsic perks and armor stat plugs,
  // for all of which everything but the currently plugged thing are distractions
  const isIntrinsic = socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.LargePerk;

  // Is this socket a perk-style socket, or something more general (mod-like)?
  const isPerk =
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Unlockable ||
    isIntrinsic ||
    isReusable;
  const isMod =
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Consumable ||
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Abilities;

  const plugSet = socketDef.reusablePlugSetHash
    ? buildCachedDimPlugSet(defs, socketDef.reusablePlugSetHash)
    : socketDef.randomizedPlugSetHash
      ? buildCachedDimPlugSet(defs, socketDef.randomizedPlugSetHash)
      : undefined;

  // The currently equipped plug, if any.
  // This will always be one of the plugOptions -- either it's added
  // as we look at all available plugs, or it's added after the loops.
  const plugged = buildPlug(defs, socket, plugObjectivesData, plugSet);
  let foundPluggedInOptions = false;
  const plugOptions: DimPlug[] = [];
  const addPlug = (plug: DimPlug) => {
    if (!plugOptions.some((p) => p.plugDef.hash === plug.plugDef.hash)) {
      plugOptions.push(plug);
      return true;
    }
    return false;
  };

  // We only build a larger list of plug options if this is a perk socket, since users would
  // only want to see (and search) the plug options for perks. For other socket types (mods, shaders, etc.)
  // we will only populate plugOptions with the currently inserted plug.
  if (isPerk && !isIntrinsic) {
    if (reusablePlugs) {
      // Get options from live info
      for (const reusablePlug of reusablePlugs) {
        if (plugged && reusablePlug.plugItemHash === plugged.plugDef.hash) {
          if (addPlug(plugged)) {
            foundPluggedInOptions = true;
          }
        } else {
          const built = buildPlug(defs, reusablePlug, plugObjectivesData, plugSet);
          if (built && filterReusablePlug(built)) {
            addPlug(built);
          }
        }
      }
    } else if (socketDef.reusablePlugSetHash) {
      // Get options from plug set, instead of live info
      const plugSet = defs.PlugSet.get(socketDef.reusablePlugSetHash, forThisItem);
      if (plugSet) {
        for (const reusablePlug of plugSet.reusablePlugItems) {
          if (plugged && reusablePlug.plugItemHash === plugged.plugDef.hash) {
            if (addPlug(plugged)) {
              foundPluggedInOptions = true;
            }
          } else {
            const built = buildDefinedPlug(
              defs,
              reusablePlug.plugItemHash,
              reusablePlug.currentlyCanRoll,
            );
            if (built && filterReusablePlug(built)) {
              addPlug(built);
            }
          }
        }
      }
    } else if (socketDef.reusablePlugItems) {
      // Get options from definition itself
      for (const reusablePlug of socketDef.reusablePlugItems) {
        if (plugged && reusablePlug.plugItemHash === plugged.plugDef.hash) {
          if (addPlug(plugged)) {
            foundPluggedInOptions = true;
          }
        } else {
          const built = buildDefinedPlug(defs, reusablePlug.plugItemHash);
          if (built && filterReusablePlug(built)) {
            addPlug(built);
          }
        }
      }
    }
  }

  if (plugged && !foundPluggedInOptions) {
    addPlug(plugged);
  }

  // TODO: is this still true? also, should this be ?? instead of ||
  const hasRandomizedPlugItems =
    Boolean(socketDef?.randomizedPlugSetHash) || socketTypeDef.alwaysRandomizeSockets;

  return {
    socketIndex: index,
    plugged,
    plugOptions,
    plugSet,
    emptyPlugItemHash: findEmptyPlug(socketDef, socketTypeDef, plugSet, reusablePlugs),
    hasRandomizedPlugItems,
    reusablePlugItems: reusablePlugs,
    isPerk,
    isMod,
    isReusable,
    visibleInGame: socket.isVisible,
    socketDefinition: socketDef,
  };
}

// This cache is used to reuse DimPlugSets across items. If we didn't do this each
// item would have their own instances of shaders, which is 100's of plugs.
const reusablePlugSetCache: { [plugSetHash: number]: DimPlugSet | undefined } = {};

/**
 * This builds a DimPlugSet based off the lookup hash for a DestinyPlugSetDefinition.
 * We cache values so that any DimSocket referring to the same DestinyPlugSetDefinition,
 * will share the same DimPlugSet instance.
 */
function buildCachedDimPlugSet(defs: D2ManifestDefinitions, plugSetHash: number): DimPlugSet {
  const cachedValue = reusablePlugSetCache[plugSetHash];
  if (cachedValue) {
    return cachedValue;
  }

  const plugs: DimPlug[] = [];
  const defPlugSet = defs.PlugSet.get(plugSetHash);
  for (const plugEntry of defPlugSet.reusablePlugItems) {
    // Deprecated mods should not actually be in any PlugSets, but here we are
    // https://github.com/Bungie-net/api/issues/1801
    if (!deprecatedMods.includes(plugEntry.plugItemHash)) {
      const plug = buildDefinedPlug(defs, plugEntry.plugItemHash, plugEntry.currentlyCanRoll);
      if (plug) {
        plugs.push(plug);
      }
    }
  }
  const [cant, can] = _.partition(plugs, (p) => plugCannotCurrentlyRoll(plugs, p.plugDef.hash));
  const dimPlugSet: DimPlugSet = {
    plugs,
    hash: plugSetHash,
    precomputedEmptyPlugItemHash: defPlugSet.reusablePlugItems.find((p) =>
      isKnownEmptyPlugItemHash(p.plugItemHash),
    )?.plugItemHash,
    plugHashesThatCannotRoll: cant.map((p) => p.plugDef.hash),
    plugHashesThatCanRoll: can.map((p) => p.plugDef.hash),
  };
  reusablePlugSetCache[plugSetHash] = dimPlugSet;

  return dimPlugSet;
}

/**
 * Determine if, given a plugSet, a given plug hash cannot roll. For this to be
 * true, the plug hash must appear in the list of plugs in the plugSet, and all
 * versions of that plug in the plugSet cannot currently roll.
 */
function plugCannotCurrentlyRoll(plugs: DimPlug[], plugHash: number) {
  let matchingPlugs = false;
  for (const p of plugs) {
    if (p.plugDef.hash === plugHash) {
      matchingPlugs = true;
      if (!p.cannotCurrentlyRoll) {
        return false; // we don't need to continue, we know it *can* roll
      }
    }
  }
  // There is at least one copy of the plug, and all matching copies cannot roll
  return matchingPlugs;
}
