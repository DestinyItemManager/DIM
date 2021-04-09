import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { getFirstSocketByCategoryHash } from 'app/utils/socket-utils';
import { SocketCategoryHashes } from 'data/d2/generated-enums';

export function getWeaponArchetypeSocket(item: DimItem): DimSocket | undefined {
  if (item.bucket.inWeapons && !item.isExotic && item.sockets) {
    return getFirstSocketByCategoryHash(item.sockets, SocketCategoryHashes.IntrinsicTraits);
  }
}

export const getWeaponArchetype = (item: DimItem): PluggableInventoryItemDefinition | undefined =>
  getWeaponArchetypeSocket(item)?.plugged?.plugDef;
