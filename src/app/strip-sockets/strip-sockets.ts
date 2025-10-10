import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';

import { canInsertPlug, insertPlug } from 'app/inventory/advanced-write-actions';
import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isReducedModCostVariant } from 'app/loadout/mod-utils';
import { DEFAULT_ORNAMENTS } from 'app/search/d2-known-values';
import { ThunkResult } from 'app/store/types';
import { CancelToken } from 'app/utils/cancel';
import { count, uniqBy } from 'app/utils/collections';
import { errorMessage } from 'app/utils/errors';
import { Destiny2CoreSettings } from 'bungie-api-ts/core';
import { ItemCategoryHashes, PlugCategoryHashes } from 'data/d2/generated-enums';

export interface StripAction {
  item: DimItem;
  socketIndex: number;
  plugItemDef: PluggableInventoryItemDefinition;
}

/**
 * Groups up strippable sockets into some bigger categories like 'ornaments'.
 *
 * Add whatever return string you want to this, and optionally add a label to the
 * i18nKeys lookup in StripSocket.tsx. If it's not reflected there, the toggle button
 * will display the itemTypeDisplayName from an example strippable plug.
 */
function identifySocket(socket: DimSocket, plugDef: PluggableInventoryItemDefinition) {
  if (plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.Shaders)) {
    return 'shaders';
  } else if (DEFAULT_ORNAMENTS.includes(socket.emptyPlugItemHash!)) {
    return 'ornaments';
  } else if (plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsDamage)) {
    return 'weaponmods';
  } else if (plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.ArmorMods)) {
    if (isReducedModCostVariant(plugDef.hash)) {
      return 'discountedmods';
    }
    return 'armormods';
  } else if (
    plugDef.plug.plugCategoryHash === PlugCategoryHashes.WeaponTieringKillVfx ||
    plugDef.plug.plugCategoryHash === PlugCategoryHashes.V900weaponModConfetti
  ) {
    return 'combatflair';
  } else if (plugDef.plug.plugCategoryHash === PlugCategoryHashes.Hologram) {
    return 'others';
  }
  // This could handle subclass options (fragments, aspects) but it wasn't quite clear
  // if they'd be useful, so they're intentionally left out here.
}

/** A made-up socket classification. */
export type SocketKind = NonNullable<ReturnType<typeof identifySocket>>;

export function collectSocketsToStrip(
  filteredItems: DimItem[],
  destiny2CoreSettings: Destiny2CoreSettings | undefined,
  defs: D2ManifestDefinitions,
) {
  const socketsByKind: {
    [kind in SocketKind]?: StripAction[];
  } = {};

  for (const item of filteredItems) {
    for (const socket of item.sockets!.allSockets) {
      if (
        socket.emptyPlugItemHash &&
        socket.plugged &&
        socket.plugged.plugDef.hash !== socket.emptyPlugItemHash &&
        canInsertPlug(socket, socket.emptyPlugItemHash, destiny2CoreSettings, defs)
      ) {
        const plugDef = socket.plugged.plugDef;
        const kind = identifySocket(socket, plugDef);
        if (kind) {
          (socketsByKind[kind] ??= []).push({
            item,
            socketIndex: socket.socketIndex,
            plugItemDef: plugDef,
          });
        }
      }
    }
  }

  const socketKinds = [];
  for (const kind in socketsByKind) {
    const items = socketsByKind[kind as keyof typeof socketsByKind]!;
    const affectedItems = uniqBy(items, (i) => i.item.id);
    const numApplicableItems = affectedItems.length;

    const numWeapons = count(affectedItems, (i) => i.item.bucket.inWeapons);
    const numArmor = count(affectedItems, (i) => i.item.bucket.inArmor);
    const numOthers = numApplicableItems - numWeapons - numArmor;

    const numApplicableSockets = items.length;

    if (numApplicableSockets > 0) {
      // Choose a socket that would be cleared by this "kind button" and
      // show the current plug as a large icon for that button.
      // This immediately presents an example for what would happen if the user
      // decided to strip sockets of this kind.
      const representativePlug = items.at(-1)!.plugItemDef;

      socketKinds.push({
        kind: kind as keyof typeof socketsByKind,
        items,
        representativePlug,
        numWeapons,
        numArmor,
        numOthers,
        numApplicableSockets,
      });
    }
  }
  return socketKinds;
}

export function doStripSockets(
  socketList: StripAction[],
  cancelToken: CancelToken,
  progressCallback: (idx: number, errorMsg: string | undefined) => void,
): ThunkResult {
  return async (dispatch) => {
    for (let i = 0; i < socketList.length; i++) {
      cancelToken.checkCanceled();

      const entry = socketList[i];

      try {
        const socket = entry.item.sockets!.allSockets.find(
          (i) => i.socketIndex === entry.socketIndex,
        )!;
        await dispatch(insertPlug(entry.item, socket, socket.emptyPlugItemHash!));
        progressCallback(i, undefined);
      } catch (e) {
        progressCallback(i, errorMessage(e));
      }
    }
  };
}
