import { DimItem, DimSocket, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { SocketCategoryHashes } from 'data/d2/generated-enums';

export function getWeaponArchetypeSocket(item?: DimItem): DimSocket | undefined {
  if (item?.bucket.inWeapons && !item.isExotic) {
    return item.sockets?.categories.find(
      (c) => c.category.hash === SocketCategoryHashes.IntrinsicTraits
    )?.sockets[0];
  }
}

export const getWeaponArchetype = (item?: DimItem): PluggableInventoryItemDefinition | undefined =>
  getWeaponArchetypeSocket(item)?.plugged?.plugDef;

export const generateArchetypeQuery = (item?: DimItem): string | undefined => {
  const weaponArchetype = getWeaponArchetype(item);
  if (weaponArchetype) {
    return `perk:"${weaponArchetype.displayProperties.name}"`;
  }
};
