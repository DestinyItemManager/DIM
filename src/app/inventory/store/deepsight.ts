import { THE_FORBIDDEN_BUCKET } from 'app/search/d2-known-values';
import { socketContainsPlugWithCategory } from 'app/utils/socket-utils';
import { PlugCategoryHashes } from 'data/d2/generated-enums';
import { DimItem, DimSocket } from '../item-types';

export function buildDeepsightInfo(item: DimItem): boolean {
  const resonanceSocket = getResonanceSocket(item);
  return Boolean(resonanceSocket?.visibleInGame);
}

function getResonanceSocket(item: DimItem): DimSocket | undefined {
  if (item.sockets && (item.bucket.inWeapons || item.bucket.hash === THE_FORBIDDEN_BUCKET)) {
    return item.sockets.allSockets.find(isDeepsightResonanceSocket);
  }
}

export function isDeepsightResonanceSocket(socket: DimSocket): boolean {
  return Boolean(
    socketContainsPlugWithCategory(socket, PlugCategoryHashes.CraftingPlugsWeaponsModsMemories),
  );
}

export function isHarmonizable(item: DimItem): boolean | undefined {
  const isItemHarmonizable = item.sockets?.allSockets.some(
    (s) =>
      s.plugged?.plugDef.plug.plugCategoryHash ===
        PlugCategoryHashes.CraftingPlugsWeaponsModsExtractors && s.visibleInGame,
  );

  return isItemHarmonizable;
}
