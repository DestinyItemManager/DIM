import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { tl } from 'app/i18next-t';
import { canInsertPlug, insertPlug } from 'app/inventory/advanced-write-actions';
import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { manifestSelector } from 'app/manifest/selectors';
import { DEFAULT_ORNAMENTS } from 'app/search/d2-known-values';
import { RootState, ThunkResult } from 'app/store/types';
import { CancelToken } from 'app/utils/cancel';
import { uniqBy } from 'app/utils/util';
import { Destiny2CoreSettings } from 'bungie-api-ts/core';
import { BucketHashes, ItemCategoryHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import { createSelector } from 'reselect';

export interface StripAction {
  item: DimItem;
  socketIndex: number;
  plugItemDef: PluggableInventoryItemDefinition;
}

/** A made-up socket classification. */
export type SocketKind =
  | 'shaders'
  | 'ornaments'
  | 'weaponmods'
  | 'artifactmods'
  | 'armormods'
  | 'subclass'
  | 'others';

function identifySocket(
  socket: DimSocket,
  plugDef: PluggableInventoryItemDefinition,
  artifactMods: Set<number> | undefined
): SocketKind | undefined {
  if (plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.Shaders)) {
    return 'shaders';
  } else if (DEFAULT_ORNAMENTS.includes(socket.emptyPlugItemHash!)) {
    return 'ornaments';
  } else if (plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.WeaponModsDamage)) {
    return 'weaponmods';
  } else if (artifactMods?.has(plugDef.hash)) {
    return 'artifactmods';
  } else if (plugDef.itemCategoryHashes?.includes(ItemCategoryHashes.ArmorMods)) {
    return 'armormods';
  } else if (plugDef.plug.plugCategoryHash === PlugCategoryHashes.Hologram) {
    return 'others';
  }
  // This could handle subclass options (fragments, aspects) but it wasn't quite clear
  // if they'd be useful, so they're intentionally left out here.
}

export const artifactModsSelector = createSelector(
  manifestSelector,
  (state: RootState) =>
    allItemsSelector(state).find((i) => i.bucket.hash === BucketHashes.SeasonalArtifact)
      ?.previewVendor,
  (defs, vendorHash) => {
    if (!defs?.isDestiny2()) {
      return undefined;
    }
    const vendor = vendorHash && defs.Vendor.get(vendorHash);
    return vendor ? new Set(vendor.itemList.map((i) => i.itemHash)) : undefined;
  }
);

export function collectSocketsToStrip(
  filteredItems: DimItem[],
  destiny2CoreSettings: Destiny2CoreSettings,
  defs: D2ManifestDefinitions,
  artifactMods: Set<number> | undefined
) {
  const socketsByKind: {
    [kind in SocketKind]: {
      name: string;
      items?: StripAction[];
    };
  } = {
    shaders: {
      name: tl('StripSockets.Shaders'),
    },
    ornaments: {
      name: tl('StripSockets.Ornaments'),
    },
    weaponmods: {
      name: tl('StripSockets.WeaponMods'),
    },
    artifactmods: {
      name: tl('StripSockets.ArtifactMods'),
    },
    armormods: {
      name: tl('StripSockets.ArmorMods'),
    },
    subclass: {
      name: tl('StripSockets.Subclass'),
    },
    others: {
      name: tl('StripSockets.Others'),
    },
  };

  for (const item of filteredItems) {
    for (const socket of item.sockets!.allSockets) {
      if (
        socket.emptyPlugItemHash &&
        socket.plugged &&
        socket.plugged.plugDef.hash !== socket.emptyPlugItemHash &&
        canInsertPlug(socket, socket.emptyPlugItemHash, destiny2CoreSettings, defs)
      ) {
        const plugDef = socket.plugged.plugDef;
        const kind = identifySocket(socket, plugDef, artifactMods);
        if (kind) {
          (socketsByKind[kind].items ??= []).push({
            item,
            socketIndex: socket.socketIndex,
            plugItemDef: plugDef,
          });
        }
      }
    }
  }

  const socketKinds = [];
  for (const [kind, contents] of Object.entries(socketsByKind)) {
    if (!contents.items) {
      continue;
    }
    const affectedItems = uniqBy(contents.items, (i) => i.item.id);
    const numApplicableItems = affectedItems.length;

    const numWeapons = affectedItems.filter((i) => i.item.bucket.inWeapons).length;
    const numArmor = affectedItems.filter((i) => i.item.bucket.inArmor).length;
    const numOthers = numApplicableItems - numWeapons - numArmor;

    const numApplicableSockets = contents.items.length;

    if (numApplicableSockets > 0) {
      // Choose a socket that would be cleared by this "kind button" and
      // show the current plug as a large icon for that button.
      // This immediately presents an example for what would happen if the user
      // decided to strip sockets of this kind.
      const representativePlug = contents.items[contents.items.length - 1].plugItemDef;

      socketKinds.push({
        kind: kind as SocketKind,
        ...contents,
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
  progressCallback: (idx: number, errorMsg: string | undefined) => void
): ThunkResult {
  return async (dispatch) => {
    for (let i = 0; i < socketList.length; i++) {
      cancelToken.checkCanceled();

      const entry = socketList[i];

      try {
        const socket = entry.item.sockets!.allSockets.find(
          (i) => i.socketIndex === entry.socketIndex
        )!;
        await dispatch(insertPlug(entry.item, socket, socket.emptyPlugItemHash!));
        progressCallback(i, undefined);
      } catch (e) {
        progressCallback(i, e.message ?? '???');
      }
    }
  };
}
