import { UNSET_PLUG_HASH } from 'app/loadout/known-values';
import { DEFAULT_ORNAMENTS } from 'app/search/d2-known-values';
import { isEmpty } from 'app/utils/collections';
import { errorLog } from 'app/utils/log';
import perkToEnhanced from 'data/d2/trait-to-enhanced-trait.json';
import { produce } from 'immer';
import { useCallback, useState } from 'react';
import { DimItem, DimPlug, DimSocket } from '../item-types';
import { ItemCreationContext } from './d2-item-factory';
import { buildDefinedPlug } from './sockets';
import { buildStats } from './stats';

/**
 * Socket overrides are a map from socket index to plug item hash. The plug item hash
 * should be one of the socket's plugOptions (or at least a valid plug for that socket).
 */
export interface SocketOverrides {
  [socketIndex: number]: number;
}

/**
 * Transform an item into a new item whose properties (mostly stats) reflect the chosen socket overrides.
 */
export function applySocketOverrides(
  // We don't need everything here but I'm assuming over time we'll want to plumb more stuff into stats calculations?
  { defs, customStats }: ItemCreationContext,
  item: DimItem,
  socketOverrides: SocketOverrides | undefined,
): DimItem {
  if (!socketOverrides || isEmpty(socketOverrides) || !item.sockets) {
    return item;
  }

  let icon = item.icon;

  const sockets = item.sockets.allSockets.map((s): DimSocket => {
    const override = socketOverrides[s.socketIndex];

    // We need to shallow-clone all the plugs because the stats process will re-set them!
    // We also do some work here to make sure that we can compare the different plugs by reference.
    // This happens even for sockets that don't change, because we're going to regenerate their
    // stats and who knows, they could end up different than the original and we wouldn't want to
    // overwrite them.
    let plugOptions: DimPlug[] = s.plugOptions.map((p) => ({ ...p, stats: null }));

    if (override && override !== UNSET_PLUG_HASH && s.plugged?.plugDef.hash !== override) {
      let newPlug, actuallyPlugged;

      if (s.isPerk) {
        newPlug =
          plugOptions.find((p) => p.plugDef.hash === override) ??
          plugOptions.find((p) => perkToEnhanced[p.plugDef.hash] === override);
        actuallyPlugged = plugOptions.find((p) => p.plugDef.hash === s.plugged?.plugDef.hash);
      } else {
        // This is likely a mod selection!
        const createdPlug = buildDefinedPlug(defs, override);
        if (createdPlug) {
          newPlug = createdPlug;
          // Mod sockets' plugOptions only ever
          // contain the currently plugged item
          actuallyPlugged = plugOptions.find((p) => p.plugDef.hash === s.plugged?.plugDef.hash);
          plugOptions = [newPlug];
        }
      }

      if (newPlug) {
        // If this is an ornament, override the item's icon as well
        if (newPlug.plugDef.plug.plugCategoryIdentifier.includes('skins')) {
          if (DEFAULT_ORNAMENTS.includes(newPlug.plugDef.hash)) {
            icon = defs.InventoryItem.get(item.hash).displayProperties.icon;
          } else {
            icon = newPlug.plugDef.displayProperties.icon;
          }
        }
        return {
          ...s,
          actuallyPlugged,
          plugged: newPlug,
          plugOptions,
        };
      } else {
        errorLog(
          'applySocketOverrides',
          "Tried to override to a socket that didn't exist in the options",
          override,
          s.plugOptions,
        );
      }
    }

    // Even for sockets we don't change, we have to make new objects so we don't rewrite the stats of the original item's plugs
    // and we need to make sure they're referentially comparable
    const plugged = plugOptions.find((p) => p.plugDef.hash === s.plugged?.plugDef.hash) ?? null;
    return {
      ...s,
      plugged,
      plugOptions,
    };
  });

  const updatedItem: DimItem = {
    ...item,
    icon,
    sockets: {
      ...item.sockets,
      allSockets: sockets,
    },
  };

  // Recalculate the entire item's stats from scratch given the new plugs
  updatedItem.stats = buildStats(defs, updatedItem, customStats);

  return updatedItem;
}

/**
 * A hook to manage socket overrides for a single item.
 */
export function useSocketOverrides(): [
  socketOverrides: SocketOverrides,
  onPlugClicked: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void,
  resetOverrides: () => void,
] {
  const [socketOverrides, setSocketOverrides] = useState<SocketOverrides>({});
  const onPlugClicked = useCallback(
    ({ socket, plugHash }: { item: DimItem; socket: DimSocket; plugHash: number }) => {
      setSocketOverrides(
        produce((so) => {
          if (so[socket.socketIndex] && plugHash === socket.actuallyPlugged?.plugDef.hash) {
            delete so[socket.socketIndex];
          } else {
            so[socket.socketIndex] = plugHash;
          }
        }),
      );
    },
    [],
  );
  const resetOverrides = useCallback(() => setSocketOverrides({}), []);
  return [socketOverrides, onPlugClicked, resetOverrides];
}

export interface SocketOverridesForItems {
  [itemId: string]: SocketOverrides;
}

export type PlugClickedHandler = (value: {
  item: DimItem;
  socket: DimSocket;
  plugHash: number;
}) => void;

/**
 * A hook to manage socket overrides for multiple items.
 */
export function useSocketOverridesForItems(
  initialOverrides: SocketOverridesForItems = {},
): [socketOverrides: SocketOverridesForItems, onPlugClicked: PlugClickedHandler] {
  const [socketOverrides, setSocketOverrides] = useState<SocketOverridesForItems>(initialOverrides);
  const onPlugClicked = useCallback(
    ({ item, socket, plugHash }: { item: DimItem; socket: DimSocket; plugHash: number }) => {
      setSocketOverrides(
        produce((so) => {
          if (!so[item.id]) {
            so[item.id] = {};
          }

          if (
            so[item.id][socket.socketIndex] &&
            plugHash === socket.actuallyPlugged?.plugDef.hash
          ) {
            delete so[item.id][socket.socketIndex];
          } else {
            so[item.id][socket.socketIndex] = plugHash;
          }

          if (isEmpty(so[item.id])) {
            delete so[item.id];
          }
        }),
      );
    },
    [],
  );

  return [socketOverrides, onPlugClicked];
}
