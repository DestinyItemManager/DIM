import {
  DestinyItemComponent,
  DestinyInventoryItemDefinition,
  DestinyItemSocketEntryDefinition,
  DestinyItemSocketState,
  DestinyItemSocketEntryPlugItemDefinition,
  DestinyItemComponentSetOfint64,
  DestinyItemPlugBase,
  DestinyObjectiveProgress,
  DestinySocketCategoryStyle
} from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DimSockets, DimSocketCategory, DimSocket, DimPlug } from '../item-types';
import { compareBy } from 'app/utils/comparators';
import _ from 'lodash';

/**
 * These are the utilities that deal with Sockets and Plugs on items. Sockets and Plugs
 * are how perks, mods, and many other things are implemented on items.
 *
 * This is called from within d2-item-factory.service.ts
 */

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

/** The item category hash for "intrinsic perk" */
export const INTRINSIC_PLUG_CATEGORY = 2237038328;
/** The item category hash for "masterwork mods" */
export const MASTERWORK_MOD_CATEGORY = 141186804;
/** The item category hash for "ghost projections" */
const GHOST_MOD_CATEGORY = 1404791674;

/** the default shader InventoryItem in every empty shader slot */
export const DEFAULT_SHADER = 4248210736;

/** the default glow InventoryItem in every empty glow slot */
export const DEFAULT_GLOW = 3807544519;
/** The item category hash for "glows" */
export const DEFAULT_GLOW_CATEGORY = 1875601085;

/** An array of default ornament hashes */
export const DEFAULT_ORNAMENTS: number[] = [2931483505, 1959648454, 702981643];

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
  let missingSockets = false;

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
    if (item.itemInstanceId && socketData && !socketData[item.itemInstanceId]) {
      missingSockets = true;
    }
    sockets = buildDefinedSockets(defs, itemDef);
  }

  return { sockets, missingSockets };
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
  if (
    !item.itemInstanceId ||
    !itemDef.sockets ||
    !itemDef.sockets.socketEntries.length ||
    !sockets ||
    !sockets.length
  ) {
    return null;
  }

  const realSockets: (DimSocket | undefined)[] = [];
  for (let i = 0; i < sockets.length; i++) {
    const built = buildSocket(
      defs,
      sockets[i],
      itemDef.sockets.socketEntries[i],
      i,
      reusablePlugData?.[i],
      plugObjectivesData
    );

    realSockets.push(built);
  }

  const categories: DimSocketCategory[] = [];

  for (const category of itemDef.sockets.socketCategories) {
    const sockets: DimSocket[] = [];
    for (const index of category.socketIndexes) {
      const s = realSockets[index];
      if (s) {
        sockets.push(s);
      }
    }

    categories.push({
      category: defs.SocketCategory.get(category.socketCategoryHash),
      sockets
    });
  }

  return {
    sockets: _.compact(realSockets), // Flat list of sockets
    categories: categories.sort(compareBy((c) => c.category.index)) // Sockets organized by category
  };
}

/**
 * Build sockets that come from only the definition. We won't be able to tell which ones are selected.
 */
function buildDefinedSockets(
  defs: D2ManifestDefinitions,
  itemDef: DestinyInventoryItemDefinition
): DimSockets | null {
  const sockets = itemDef.sockets.socketEntries;
  if (!sockets || !sockets.length) {
    return null;
  }

  const realSockets: (DimSocket | undefined)[] = [];
  // TODO: check out intrinsicsockets as well

  for (let i = 0; i < sockets.length; i++) {
    const socket = sockets[i];
    realSockets.push(buildDefinedSocket(defs, socket, i));
  }

  const categories: DimSocketCategory[] = [];

  for (const category of itemDef.sockets.socketCategories) {
    const sockets: DimSocket[] = [];

    for (const index of category.socketIndexes) {
      const s = realSockets[index];
      if (s?.plugOptions.length) {
        sockets.push(s);
      }
    }

    categories.push({
      category: defs.SocketCategory.get(category.socketCategoryHash),
      sockets
    });
  }

  return {
    sockets: _.compact(realSockets), // Flat list of sockets
    categories: categories.sort(compareBy((c) => c.category.index)) // Sockets organized by category
  };
}

function filterReusablePlug(reusablePlug: DimPlug) {
  const itemCategoryHashes = reusablePlug.plugItem.itemCategoryHashes || [];
  return (
    !EXCLUDED_PLUGS.has(reusablePlug.plugItem.hash) &&
    !itemCategoryHashes.includes(MASTERWORK_MOD_CATEGORY) &&
    !itemCategoryHashes.includes(GHOST_MOD_CATEGORY) &&
    (!reusablePlug.plugItem.plug ||
      !reusablePlug.plugItem.plug.plugCategoryIdentifier.includes('masterworks.stat'))
  );
}

/**
 * Build a socket from definitions, without the benefit of live profile info.
 */
function buildDefinedSocket(
  defs: D2ManifestDefinitions,
  socketDef: DestinyItemSocketEntryDefinition,
  index: number
): DimSocket | undefined {
  if (!socketDef) {
    return undefined;
  }

  const socketTypeDef = defs.SocketType.get(socketDef.socketTypeHash);
  if (!socketTypeDef) {
    return undefined;
  }
  const socketCategoryDef = defs.SocketCategory.get(socketTypeDef.socketCategoryHash);
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
      const plugSet = defs.PlugSet.get(socketDef.reusablePlugSetHash);
      for (const reusablePlug of plugSet.reusablePlugItems) {
        const built = buildDefinedPlug(defs, reusablePlug);
        if (built) {
          reusablePlugs.push(built);
        }
      }
    } else if (socketDef.reusablePlugItems) {
      for (const reusablePlug of socketDef.reusablePlugItems) {
        const built = buildDefinedPlug(defs, reusablePlug);
        if (built) {
          reusablePlugs.push(built);
        }
      }
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

  return {
    socketIndex: index,
    plug: null,
    plugOptions,
    reusablePlugItems: [],
    hasRandomizedPlugItems:
      Boolean(socketDef.randomizedPlugSetHash) || socketTypeDef.alwaysRandomizeSockets,
    isPerk,
    socketDefinition: socketDef
  };
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

  let plugItem = defs.InventoryItem.get(plugHash);
  if (!plugItem && socketDef.singleInitialItemHash) {
    plugItem = defs.InventoryItem.get(socketDef.singleInitialItemHash);
  }

  if (!plugItem) {
    return null;
  }

  const failReasons = plug.enableFailIndexes
    ? _.compact(
        plug.enableFailIndexes.map((index) => plugItem.plug.enabledRules[index]?.failureMessage)
      ).join('\n')
    : '';

  return {
    plugItem,
    enabled: enabled && (!isDestinyItemPlug(plug) || plug.canInsert),
    enableFailReasons: failReasons,
    plugObjectives: plugObjectivesData?.[plugHash] || [],
    perks: plugItem.perks ? plugItem.perks.map((perk) => defs.SandboxPerk.get(perk.perkHash)) : [],
    stats: null
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
    perks: (plugItem.perks || []).map((perk) => defs.SandboxPerk.get(perk.perkHash)),
    stats: null
  };
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
  }
): DimSocket | undefined {
  if (
    !socketDef ||
    (!socket.isVisible &&
      // Keep the kill-tracker socket around even though it may not be visible
      // TODO: does this really happen? I think all these sockets are visible
      !(socket.plugHash && plugObjectivesData?.[socket.plugHash]?.length))
  ) {
    return undefined;
  }

  const socketTypeDef = defs.SocketType.get(socketDef.socketTypeHash);
  if (!socketTypeDef) {
    return undefined;
  }
  const socketCategoryDef = defs.SocketCategory.get(socketTypeDef.socketCategoryHash);
  if (!socketCategoryDef) {
    return undefined;
  }

  // Is this socket a perk-style socket, or something more general (mod-like)?
  const isPerk =
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Reusable ||
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.Unlockable ||
    socketCategoryDef.categoryStyle === DestinySocketCategoryStyle.LargePerk;

  // The currently equipped plug, if any.
  const plug = buildPlug(defs, socket, socketDef, plugObjectivesData);
  // TODO: not sure if this should always be included!
  const plugOptions = plug ? [plug] : [];

  // We only build a larger list of plug options if this is a perk socket, since users would
  // only want to see (and search) the plug options for perks. For other socket types (mods, shaders, etc.)
  // we will only populate plugOptions with the currently inserted plug.
  if (isPerk && reusablePlugs) {
    for (const reusablePlug of reusablePlugs) {
      const built = buildPlug(defs, reusablePlug, socketDef, plugObjectivesData);
      if (built && filterReusablePlug(built)) {
        if (plug && built.plugItem.hash === plug.plugItem.hash) {
          // Use the inserted plug we built earlier in this position, rather than the one we build from reusablePlugs.
          plugOptions.shift();
          plugOptions.push(plug);
        } else {
          // API Bugfix: Filter out intrinsic perks past the first: https://github.com/Bungie-net/api/issues/927
          if (
            !built.plugItem.itemCategoryHashes ||
            !built.plugItem.itemCategoryHashes.includes(INTRINSIC_PLUG_CATEGORY)
          ) {
            plugOptions.push(built);
          }
        }
      }
    }
  }

  // TODO: is this still true? also, should this be ?? instead of ||
  const hasRandomizedPlugItems =
    Boolean(socketDef?.randomizedPlugSetHash) || socketTypeDef.alwaysRandomizeSockets;

  return {
    socketIndex: index,
    plug,
    plugOptions,
    hasRandomizedPlugItems,
    reusablePlugItems: reusablePlugs,
    isPerk,
    socketDefinition: socketDef
  };
}
