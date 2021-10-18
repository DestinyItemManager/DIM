import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { compareBy } from 'app/utils/comparators';
import {
  DestinyInventoryItemDefinition,
  DestinyItemComponent,
  DestinyItemComponentSetOfint64,
  DestinyItemPlugBase,
  DestinyItemSocketEntryDefinition,
  DestinyItemSocketState,
  DestinyObjectiveProgress,
  DestinySocketCategoryStyle,
} from 'bungie-api-ts/destiny2';
import {
  ItemCategoryHashes,
  PlugCategoryHashes,
  SocketCategoryHashes,
} from 'data/d2/generated-enums';
import _ from 'lodash';
import {
  DimPlug,
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
export function buildInstancedSockets(
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
  if (!socketDefEntries || !socketDefEntries.length) {
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
    (!reusablePlug.plugDef.plug ||
      !reusablePlug.plugDef.plug.plugCategoryIdentifier.includes('masterworks.stat'))
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

  // The currently equipped plug, if any
  const reusablePlugs: DimPlug[] = [];

  // We only build a larger list of plug options if this is a perk socket, since users would
  // only want to see (and search) the plug options for perks. For other socket types (mods, shaders, etc.)
  // we will only populate plugOptions with the currently inserted plug.
  if (isPerk) {
    if (socketDef.reusablePlugSetHash) {
      const plugSet = defs.PlugSet.get(socketDef.reusablePlugSetHash, forThisItem);
      if (plugSet) {
        for (const reusablePlug of plugSet.reusablePlugItems) {
          const built = buildDefinedPlug(defs, reusablePlug.plugItemHash);
          if (built) {
            built.cannotCurrentlyRoll = !reusablePlug.currentlyCanRoll;
            reusablePlugs.push(built);
          }
        }
      }
    } else if (socketDef.randomizedPlugSetHash) {
      const plugSet = defs.PlugSet.get(socketDef.randomizedPlugSetHash, forThisItem);
      if (plugSet) {
        for (const reusablePlug of _.uniqBy(plugSet.reusablePlugItems, (p) => p.plugItemHash)) {
          const built = buildDefinedPlug(defs, reusablePlug.plugItemHash);
          if (built) {
            built.cannotCurrentlyRoll = !reusablePlug.currentlyCanRoll;
            reusablePlugs.push(built);
          }
        }
      }
    } else if (socketDef.reusablePlugItems) {
      for (const reusablePlug of socketDef.reusablePlugItems) {
        const built = buildDefinedPlug(defs, reusablePlug.plugItemHash);
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
    const built = buildDefinedPlug(defs, socketDef.singleInitialItemHash);
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

  return {
    socketIndex: index,
    plugged,
    plugOptions,
    curatedRoll: null,
    reusablePlugItems: [],
    hasRandomizedPlugItems:
      Boolean(socketDef.randomizedPlugSetHash) || socketTypeDef.alwaysRandomizeSockets,
    isPerk,
    socketDefinition: socketDef,
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
    perks: plugDef.perks ? plugDef.perks.map((perk) => defs.SandboxPerk.get(perk.perkHash)) : [],
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
    perks: (plugDef.perks || []).map((perk) => defs.SandboxPerk.get(perk.perkHash)),
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
          const built = buildDefinedPlug(defs, reusablePlug.plugItemHash);
          addPlugOption(built, plugged, plugOptions);
        }
        curatedRoll = plugSet.reusablePlugItems.map((p) => p.plugItemHash);
      }
    } else if (socketDef.reusablePlugItems) {
      // Get options from definition itself
      for (const reusablePlug of socketDef.reusablePlugItems) {
        const built = buildDefinedPlug(defs, reusablePlug.plugItemHash);
        addPlugOption(built, plugged, plugOptions);
      }
      curatedRoll = socketDef.reusablePlugItems.map((p) => p.plugItemHash);
    }
  }

  // TODO: is this still true? also, should this be ?? instead of ||
  const hasRandomizedPlugItems =
    Boolean(socketDef?.randomizedPlugSetHash) || socketTypeDef.alwaysRandomizeSockets;

  return {
    socketIndex: index,
    plugged,
    plugOptions,
    curatedRoll,
    hasRandomizedPlugItems,
    reusablePlugItems: reusablePlugs,
    isPerk,
    socketDefinition: socketDef,
  };
}
