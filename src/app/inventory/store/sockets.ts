import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { weaponMasterworkY2SocketTypeHash } from 'app/search/d2-known-values';
import { compareBy } from 'app/utils/comparators';
import { eventArmorRerollSocketIdentifiers } from 'app/utils/socket-utils';
import { hasKeys } from 'app/utils/util';
import {
  DestinyInventoryItemDefinition,
  DestinyItemComponent,
  DestinyItemComponentSetOfint64,
  DestinyItemPlugBase,
  DestinyItemSocketEntryDefinition,
  DestinyItemSocketEntryPlugItemRandomizedDefinition,
  DestinyItemSocketState,
  DestinyObjectiveProgress,
  DestinySocketCategoryStyle,
  DestinySocketTypeDefinition,
  SocketPlugSources,
} from 'bungie-api-ts/destiny2';
import { emptyPlugHashes } from 'data/d2/empty-plug-hashes';
import {
  ItemCategoryHashes,
  PlugCategoryHashes,
  SocketCategoryHashes,
} from 'data/d2/generated-enums';
import _ from 'lodash';
import {
  DimPlug,
  DimPlugSet,
  DimSocket,
  DimSocketCategory,
  DimSockets,
  PluggableInventoryItemDefinition,
} from '../item-types';

//
// These are the utilities that deal with Sockets and Plugs on items. Sockets and Plugs
// are how perks, mods, and many other things are implemented on items.
//
// This is called from within d2-item-factory.service.ts
//

/**
 * Calculate all the sockets we want to display (or make searchable). Sockets represent perks,
 * mods, and intrinsic properties of the item. They're really the swiss army knife of item
 * customization.
 */
export function buildSockets(
  item: DestinyItemComponent,
  itemComponents: DestinyItemComponentSetOfint64 | undefined,
  defs: D2ManifestDefinitions,
  itemDef: DestinyInventoryItemDefinition
) {
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
      plugObjectivesData
    );
  }

  // If we didn't have live data (for example, when viewing vendor items or collections),
  // get sockets from the item definition.
  if (!sockets && itemDef.sockets) {
    // If this really *should* have live sockets, but didn't...
    if (item.itemInstanceId && item.itemInstanceId !== '0' && !socketData?.[item.itemInstanceId]) {
      return { sockets: null, missingSockets: true };
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
  }
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
      itemDef
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
    categories: categories.sort(compareBy((c) => c.category?.index)), // Sockets organized by category
  };
}

/**
 * Build sockets that come from only the definition. We won't be able to tell which ones are selected.
 */
function buildDefinedSockets(
  defs: D2ManifestDefinitions,
  itemDef: DestinyInventoryItemDefinition
): DimSockets | null {
  // if we made it here, item has sockets
  const socketDefEntries = itemDef.sockets!.socketEntries;
  if (!socketDefEntries?.length) {
    return null;
  }

  const createdSockets: DimSocket[] = [];
  // TODO: check out intrinsicsockets as well

  for (let i = 0; i < socketDefEntries.length; i++) {
    const socketDef = socketDefEntries[i];
    const built = buildDefinedSocket(defs, socketDef, i, itemDef);

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
    categories: categories.sort(compareBy((c) => c.category.index)), // Sockets organized by category
  };
}

function filterReusablePlug(reusablePlug: DimPlug) {
  const itemCategoryHashes = reusablePlug.plugDef.itemCategoryHashes || [];
  return (
    !itemCategoryHashes.includes(ItemCategoryHashes.MasterworksMods) &&
    !itemCategoryHashes.includes(ItemCategoryHashes.GhostModsProjections) &&
    !reusablePlug.plugDef.plug?.plugCategoryIdentifier.includes('masterworks.stat')
  );
}

/**
 * Build a socket from definitions, without the benefit of live profile info.
 */
function buildDefinedSocket(
  defs: D2ManifestDefinitions,
  socketDef: DestinyItemSocketEntryDefinition,
  index: number,
  forThisItem?: DestinyInventoryItemDefinition
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

  // Is this socket a perk-style socket, or something more general (mod-like)?
  const isPerk =
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Reusable ||
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Unlockable ||
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.LargePerk;

  const isReusable = socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Reusable;

  // The currently equipped plug, if any
  const reusablePlugs: DimPlug[] = [];

  const craftingData: NonNullable<DimSocket['craftingData']> = {};
  function addCraftingReqs(plugEntry: DestinyItemSocketEntryPlugItemRandomizedDefinition) {
    if (
      plugEntry.craftingRequirements &&
      (plugEntry.craftingRequirements.materialRequirementHashes.length ||
        plugEntry.craftingRequirements.unlockRequirements.length)
    ) {
      craftingData[plugEntry.plugItemHash] = plugEntry.craftingRequirements;
    }
  }

  // We only build a larger list of plug options if this is a perk socket, since users would
  // only want to see (and search) the plug options for perks. For other socket types (mods, shaders, etc.)
  // we will only populate plugOptions with the currently inserted plug.
  if (isPerk) {
    if (socketDef.reusablePlugSetHash) {
      const plugSet = defs.PlugSet.get(socketDef.reusablePlugSetHash, forThisItem);
      if (plugSet) {
        for (const reusablePlug of plugSet.reusablePlugItems) {
          const built = buildCachedDefinedPlug(defs, reusablePlug.plugItemHash);
          if (built) {
            reusablePlugs.push({ ...built, cannotCurrentlyRoll: !reusablePlug.currentlyCanRoll });
            addCraftingReqs(reusablePlug);
          }
        }
      }
    } else if (socketDef.randomizedPlugSetHash) {
      const plugSet = defs.PlugSet.get(socketDef.randomizedPlugSetHash, forThisItem);
      if (plugSet) {
        // Unique the plugs by hash, but also consider the perk rollable if there's a copy with currentlyCanRoll = true
        // See https://github.com/DestinyItemManager/DIM/issues/7272
        const plugs: {
          [plugItemHash: number]: DestinyItemSocketEntryPlugItemRandomizedDefinition;
        } = {};
        for (const randomPlug of plugSet.reusablePlugItems) {
          const existing = plugs[randomPlug.plugItemHash];
          if (!existing || (!existing.currentlyCanRoll && randomPlug.currentlyCanRoll)) {
            plugs[randomPlug.plugItemHash] = randomPlug;
          }
        }

        for (const randomPlug of Object.values(plugs)) {
          const built = buildCachedDefinedPlug(defs, randomPlug.plugItemHash);
          // we don't want "stat roll" plugs to count as reusablePlugs, but they're almost
          // indistinguishable from exotic intrinsic armor perks, so we stop them here based
          // on the fact that they have no name
          if (built?.plugDef.displayProperties.name) {
            reusablePlugs.push({ ...built, cannotCurrentlyRoll: !randomPlug.currentlyCanRoll });
            addCraftingReqs(randomPlug);
          }
        }
      }
    } else if (socketDef.reusablePlugItems) {
      for (const reusablePlug of socketDef.reusablePlugItems) {
        const built = buildCachedDefinedPlug(defs, reusablePlug.plugItemHash);
        if (built) {
          reusablePlugs.push(built);
        }
      }
    }
  }

  if (
    socketDef.singleInitialItemHash &&
    !reusablePlugs.find((rp) => rp.plugDef.hash === socketDef.singleInitialItemHash)
  ) {
    const built = buildCachedDefinedPlug(defs, socketDef.singleInitialItemHash);
    if (built) {
      reusablePlugs.unshift(built);
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
    : undefined;

  return {
    socketIndex: index,
    plugged,
    plugOptions,
    plugSet,
    curatedRoll: null,
    emptyPlugItemHash: findEmptyPlug(socketDef, socketTypeDef, plugSet),
    reusablePlugItems: [],
    hasRandomizedPlugItems:
      Boolean(socketDef.randomizedPlugSetHash) || socketTypeDef.alwaysRandomizeSockets,
    isPerk,
    isReusable,
    socketDefinition: socketDef,
    craftingData: hasKeys(craftingData) ? craftingData : undefined,
  };
}

/**
 * verifies a DestinyInventoryItemDefinition is pluggable into a socket
 * and converts it to a PluggableInventoryItemDefinition
 */
export function isPluggableItem(
  itemDef?: DestinyInventoryItemDefinition
): itemDef is PluggableInventoryItemDefinition {
  return itemDef?.plug !== undefined;
}

function isDestinyItemPlug(
  plug: DestinyItemPlugBase | DestinyItemSocketState
): plug is DestinyItemPlugBase {
  return Boolean((plug as DestinyItemPlugBase).plugItemHash);
}

function buildPlug(
  defs: D2ManifestDefinitions,
  plug: DestinyItemPlugBase | DestinyItemSocketState,
  socketDef: DestinyItemSocketEntryDefinition,
  plugObjectivesData?: {
    [plugItemHash: number]: DestinyObjectiveProgress[];
  }
): DimPlug | null {
  const plugHash = isDestinyItemPlug(plug) ? plug.plugItemHash : plug.plugHash;
  const enabled = isDestinyItemPlug(plug) ? plug.enabled : plug.isEnabled;

  if (!plugHash) {
    return null;
  }

  let plugDef = defs.InventoryItem.get(plugHash);
  if (!plugDef && socketDef.singleInitialItemHash) {
    plugDef = defs.InventoryItem.get(socketDef.singleInitialItemHash);
  }

  if (!plugDef || !isPluggableItem(plugDef)) {
    return null;
  }

  const failReasons = plug.enableFailIndexes
    ? _.compact(
        plug.enableFailIndexes.map((index) => plugDef.plug!.enabledRules[index]?.failureMessage)
      ).join('\n')
    : '';

  return {
    plugDef,
    enabled: enabled && (!isDestinyItemPlug(plug) || plug.canInsert),
    enableFailReasons: failReasons,
    plugObjectives: plugObjectivesData?.[plugHash] || [],
    stats: null,
  };
}

export function buildDefinedPlug(defs: D2ManifestDefinitions, plugHash: number): DimPlug | null {
  const plugDef = plugHash && defs.InventoryItem.get(plugHash);
  if (!plugDef || !isPluggableItem(plugDef)) {
    return null;
  }

  return {
    plugDef,
    enabled: true,
    enableFailReasons: '',
    plugObjectives: [],
    stats: null,
  };
}

/**
 * A helper function to add plug options to a socket. This maintains the socketed plug's position in the list.
 */
function addPlugOption(
  built: DimPlug | null,
  /** The active plug, which has already been built */
  plug: DimPlug | null,
  plugOptions: DimPlug[] // mutated
) {
  if (built && filterReusablePlug(built)) {
    if (plug && built.plugDef.hash === plug.plugDef.hash) {
      // Use the inserted plug we built earlier in this position, rather than the one we build from reusablePlugs.
      plugOptions.shift();
      plugOptions.push(plug);
    } else {
      // API Bugfix: Filter out intrinsic perks past the first: https://github.com/Bungie-net/api/issues/927
      if (!built.plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsIntrinsic)) {
        plugOptions.push(built);
      }
    }
  }
}

function isKnownEmptyPlugItemHash(plugItemHash: number) {
  return emptyPlugHashes.has(plugItemHash);
}

// These socket categories never have any empty-able sockets.
const noDefaultSocketCategoryHashes: SocketCategoryHashes[] = [
  SocketCategoryHashes.Abilities_Abilities,
  SocketCategoryHashes.Abilities_Abilities_LightSubclass,
  SocketCategoryHashes.Super,
  SocketCategoryHashes.WeaponPerks_Reusable,
  SocketCategoryHashes.IntrinsicTraits,
  SocketCategoryHashes.ArmorPerks_LargePerk,
  SocketCategoryHashes.ArmorPerks_Reusable,
  SocketCategoryHashes.ArmorTier,
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
  reusablePlugs?: DestinyItemPlugBase[]
) {
  // First, perform some filtering, both for efficiency and to explicitly
  // leave emptyPlugItemHash set to undefined for sockets that never have
  // an empty plug, like abilities etc.

  if (noDefaultSocketCategoryHashes.includes(socketType.socketCategoryHash)) {
    return undefined;
  }

  // Y2+ weapon masterworks don't have an "empty" entry.
  if (socket.socketTypeHash === weaponMasterworkY2SocketTypeHash) {
    return undefined;
  }

  if (
    socketType.plugWhitelist.some((whiteListEntry) =>
      noDefaultPlugIdentifiers.some((id) =>
        typeof id === 'number'
          ? whiteListEntry.categoryHash === id
          : whiteListEntry.categoryIdentifier.startsWith(id)
      )
    )
  ) {
    return undefined;
  }

  // Sockets that ONLY get their items from your inventory necessarily can't be emptied
  if ((socket.plugSources & ~SocketPlugSources.InventorySourced) === 0) {
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
    reusablePlugs?.map((p) => p.plugItemHash).find(isKnownEmptyPlugItemHash) ||
    plugSet?.precomputedEmptyPlugItemHash ||
    socket.reusablePlugItems.map((p) => p.plugItemHash).find(isKnownEmptyPlugItemHash);

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
  forThisItem?: DestinyInventoryItemDefinition
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

  // Is this socket a perk-style socket, or something more general (mod-like)?
  const isPerk =
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Reusable ||
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Unlockable ||
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.LargePerk;

  const isReusable = socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Reusable;

  // The currently equipped plug, if any.
  const plugged = buildPlug(defs, socket, socketDef, plugObjectivesData);
  // TODO: not sure if this should always be included!
  const plugOptions = plugged ? [plugged] : [];

  // We only build a larger list of plug options if this is a perk socket, since users would
  // only want to see (and search) the plug options for perks. For other socket types (mods, shaders, etc.)
  // we will only populate plugOptions with the currently inserted plug.
  let curatedRoll: number[] | null = null;
  if (isPerk) {
    if (reusablePlugs) {
      // Get options from live info
      for (const reusablePlug of reusablePlugs) {
        const built = buildPlug(defs, reusablePlug, socketDef, plugObjectivesData);
        addPlugOption(built, plugged, plugOptions);
      }
      curatedRoll = socketDef.reusablePlugItems.map((p) => p.plugItemHash);
    } else if (socketDef.reusablePlugSetHash) {
      // Get options from plug set, instead of live info
      const plugSet = defs.PlugSet.get(socketDef.reusablePlugSetHash, forThisItem);
      if (plugSet) {
        for (const reusablePlug of plugSet.reusablePlugItems) {
          const built = buildCachedDefinedPlug(defs, reusablePlug.plugItemHash);
          addPlugOption(built, plugged, plugOptions);
        }
        curatedRoll = plugSet.reusablePlugItems.map((p) => p.plugItemHash);
      }
    } else if (socketDef.reusablePlugItems) {
      // Get options from definition itself
      for (const reusablePlug of socketDef.reusablePlugItems) {
        const built = buildCachedDefinedPlug(defs, reusablePlug.plugItemHash);
        addPlugOption(built, plugged, plugOptions);
      }
      curatedRoll = socketDef.reusablePlugItems.map((p) => p.plugItemHash);
    }
  }

  // TODO: is this still true? also, should this be ?? instead of ||
  const hasRandomizedPlugItems =
    Boolean(socketDef?.randomizedPlugSetHash) || socketTypeDef.alwaysRandomizeSockets;

  const plugSet = socketDef.reusablePlugSetHash
    ? buildCachedDimPlugSet(defs, socketDef.reusablePlugSetHash)
    : undefined;

  return {
    socketIndex: index,
    plugged,
    plugOptions,
    plugSet,
    curatedRoll,
    emptyPlugItemHash: findEmptyPlug(socketDef, socketTypeDef, plugSet, reusablePlugs),
    hasRandomizedPlugItems,
    reusablePlugItems: reusablePlugs,
    isPerk,
    isReusable,
    socketDefinition: socketDef,
  };
}

// This cache is used to reuse DimPlugSets across items. If we didn't do this each
// item would have their own instances of shaders, which is 100's of plugs.
const reusablePlugSetCache: { [plugSetHash: number]: DimPlugSet | undefined } = {};

// This cache is used to reuse DimPlugs across items. There are a lot of plugs so this
// reduces the number of identical plugs we have in memory.
const definedPlugCache: { [plugHash: number]: DimPlug | undefined | null } = {};

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
    const plug = buildCachedDefinedPlug(defs, plugEntry.plugItemHash);
    if (plug) {
      plugs.push(plug);
    }
  }

  const dimPlugSet: DimPlugSet = {
    plugs,
    hash: plugSetHash,
    precomputedEmptyPlugItemHash: defPlugSet.reusablePlugItems
      .map((p) => p.plugItemHash)
      .find(isKnownEmptyPlugItemHash),
  };
  reusablePlugSetCache[plugSetHash] = dimPlugSet;

  return dimPlugSet;
}

/**
 * This builds DimPlugs and caches their values so we reduce the number of instances in memory.
 */
function buildCachedDefinedPlug(defs: D2ManifestDefinitions, plugHash: number): DimPlug | null {
  const cachedValue = definedPlugCache[plugHash];
  // The result of buildDefinedPlug can be null, we still consider that a cached value.
  if (cachedValue !== undefined) {
    // We mutate cannotCurrentlyRoll and attach stats in this module so we need to spread the object
    // We also run DimItems through immer in the store, which means these get frozen. This essentially
    // unfreezes it in that situation. It only seems to be an issue for fake items in loadouts.
    // TODO (ryan) lets find a way around this
    return cachedValue ? { ...cachedValue } : null;
  }

  const plug = buildDefinedPlug(defs, plugHash);
  definedPlugCache[plugHash] = plug;

  // We mutate cannotCurrentlyRoll and attach stats in this module so we need to spread the object
  // TODO (ryan) lets find a way around this
  return plug ? { ...plug } : null;
}
