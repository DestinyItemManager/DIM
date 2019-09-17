import {
  DestinyItemComponent,
  DestinyItemSocketsComponent,
  DestinyInventoryItemDefinition,
  DestinyItemSocketEntryDefinition,
  DestinyItemPlug,
  DestinyItemSocketState,
  DestinyItemSocketEntryPlugItemDefinition,
  DestinyItemComponentSetOfint64
} from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import { DimSockets, DimSocketCategory, DimSocket, DimPlug } from '../item-types';
import { compareBy } from 'app/comparators';
import _ from 'lodash';
import idx from 'idx';

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

/** Plug category hashes for masterwork plugs */
const masterworkPlugCategoryHashes = [2109207426, 2989652629];
/** Item hashes for empty masterwork upgrade items */
const masterworkUpgradeItemHashes = [1176735155, 236077174];

export function buildSockets(
  item: DestinyItemComponent,
  itemComponents: DestinyItemComponentSetOfint64 | undefined,
  defs: D2ManifestDefinitions,
  itemDef: DestinyInventoryItemDefinition
) {
  let sockets: DimSockets | null = null;
  let missingSockets = false;

  const socketData = idx(itemComponents, (i) => i.sockets.data);
  if (socketData) {
    sockets = buildInstancedSockets(item, socketData, defs, itemDef);
  }
  if (!sockets && itemDef.sockets) {
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

function buildDefinedSocket(
  defs: D2ManifestDefinitions,
  socket: DestinyItemSocketEntryDefinition,
  index: number
): DimSocket {
  // The currently equipped plug, if any
  const reusablePlugs = _.compact(
    ((socket && socket.reusablePlugItems) || []).map((reusablePlug) =>
      buildDefinedPlug(defs, reusablePlug)
    )
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

  const failReasons =
    plug && plug.enableFailIndexes
      ? plug.enableFailIndexes
          .map((index) => plugItem.plug.enabledRules[index].failureMessage)
          .join('\n')
      : '';

  return {
    plugItem,
    enabled: enabled && (!isDestinyItemPlug(plug) || plug.canInsert),
    enableFailReasons: failReasons,
    plugObjectives: plug.plugObjectives || [],
    perks: plugItem.perks ? plugItem.perks.map((perk) => defs.SandboxPerk.get(perk.perkHash)) : [],
    isMasterwork:
      !masterworkUpgradeItemHashes.includes(plugItem.hash) &&
      (!plugItem.itemCategoryHashes ||
        plugItem.itemCategoryHashes.includes(MASTERWORK_MOD_CATEGORY)),
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
    isMasterwork:
      plugItem.plug && masterworkPlugCategoryHashes.includes(plugItem.plug.plugCategoryHash),
    stats: null
  };
}

function buildSocket(
  defs: D2ManifestDefinitions,
  socket: DestinyItemSocketState,
  socketEntry: DestinyItemSocketEntryDefinition | undefined,
  index: number
): DimSocket | undefined {
  if (!socket.isVisible && !(socket.plugObjectives && socket.plugObjectives.length)) {
    return undefined;
  }

  // The currently equipped plug, if any
  const plug = buildPlug(defs, socket);
  const reusablePlugs = socket.reusablePlugs
    ? _.compact(socket.reusablePlugs.map((reusablePlug) => buildPlug(defs, reusablePlug)))
    : [];
  const plugOptions = plug ? [plug] : [];
  const hasRandomizedPlugItems = Boolean(
    socketEntry && socketEntry.randomizedPlugItems && socketEntry.randomizedPlugItems.length > 0
  );

  if (reusablePlugs.length) {
    reusablePlugs.forEach((reusablePlug) => {
      if (filterReusablePlug(reusablePlug)) {
        if (plug && reusablePlug.plugItem.hash === plug.plugItem.hash) {
          plugOptions.shift();
          plugOptions.push(plug);
        } else {
          // API Bugfix: Filter out intrinsic perks past the first: https://github.com/Bungie-net/api/issues/927
          if (
            !reusablePlug.plugItem.itemCategoryHashes ||
            !reusablePlug.plugItem.itemCategoryHashes.includes(INTRINSIC_PLUG_CATEGORY)
          ) {
            plugOptions.push(reusablePlug);
          }
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
