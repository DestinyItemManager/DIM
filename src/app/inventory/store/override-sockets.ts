import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { errorLog } from 'app/utils/log';
import produce from 'immer';
import _ from 'lodash';
import { useCallback, useState } from 'react';
import { DimItem, DimPlug, DimSocket } from '../item-types';
import { buildDefinedPlug } from './sockets';
import { buildStats } from './stats';

/**
 * Socket overrides are a map from socket index to plug item hash. The plug item hash
 * should be one of the socket's plugOptions (or at least a valid plug for that socket).
 */
export type SocketOverrides = {
  [socketIndex: number]: number;
};

/**
 * Transform an item into a new item whose properties (mostly stats) reflect the chosen socket overrides.
 */
export function applySocketOverrides(
  defs: D2ManifestDefinitions,
  item: DimItem,
  socketOverrides?: SocketOverrides
): DimItem {
  if (!socketOverrides || _.isEmpty(socketOverrides) || !item.sockets) {
    return item;
  }

  const sockets = item.sockets.allSockets.map((s): DimSocket => {
    const override = socketOverrides[s.socketIndex];

    // We need to shallow-clone all the plugs because the stats process will re-set them!
    // We also do some work here to make sure that we can compare the different plugs by reference.
    // This happens even for sockets that don't change, because we're going to regenerate their
    // stats and who knows, they could end up different than the original and we wouldn't want to
    // overwrite them.
    let plugOptions: DimPlug[] = s.plugOptions.map((p) => ({ ...p, stats: null }));

    if (override && s.plugged?.plugDef.hash !== override) {
      let newPlug = plugOptions.find((p) => p.plugDef.hash === override);
      if (!newPlug && !s.isPerk) {
        // This is likely a mod selection!
        const createdPlug = buildDefinedPlug(defs, override);
        if (createdPlug) {
          newPlug = createdPlug;
          plugOptions = [newPlug];
        }
      }

      if (newPlug) {
        // Back up the real plug here
        const actuallyPlugged = plugOptions.find((p) => p.plugDef.hash === s.plugged?.plugDef.hash);

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
          s.plugOptions
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
    sockets: {
      ...item.sockets,
      allSockets: sockets,
    },
  };

  // Recalculate the entire item's stats from scratch given the new plugs
  updatedItem.stats = buildStats(defs, updatedItem);

  return updatedItem;
}

/**
 * A hook to manage socket overrides for a single item.
 */
export function useSocketOverrides(): [
  socketOverrides: SocketOverrides,
  onPlugClicked: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void,
  resetOverrides: () => void
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
        })
      );
    },
    []
  );
  const resetOverrides = useCallback(() => setSocketOverrides({}), []);
  return [socketOverrides, onPlugClicked, resetOverrides];
}

export type SocketOverridesForItems = { [itemId: string]: SocketOverrides };

/**
 * A hook to manage socket overrides for multiple items.
 */
export function useSocketOverridesForItems(
  initialOverrides: SocketOverridesForItems = {}
): [
  socketOverrides: SocketOverridesForItems,
  onPlugClicked: (value: { item: DimItem; socket: DimSocket; plugHash: number }) => void,
  resetSocketOverrides: () => void
] {
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

          if (_.isEmpty(so[item.id])) {
            delete so[item.id];
          }
        })
      );
    },
    []
  );

  const resetSocketOverrides = useCallback(() => setSocketOverrides({}), []);

  return [socketOverrides, onPlugClicked, resetSocketOverrides];
}
