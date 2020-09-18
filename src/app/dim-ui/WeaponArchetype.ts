import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { SocketCategoryHashes } from 'data/d2/generated-enums';

export function getWeaponArchetypeSocket(item: DimItem): DimSocket | undefined {
  if (item.bucket.inWeapons && !item.isExotic) {
    return item.sockets?.categories.find(
      (c) => c.category.hash === SocketCategoryHashes.IntrinsicTraits
    )?.sockets[0];
  }
}

export const getWeaponArchetype: (item: DimItem) => PluggableInventoryItemDefinition | undefined = (
  item
) => getWeaponArchetypeSocket(item)?.plugged?.plugDef;
