import { DimItem } from 'app/inventory/item-types';
import { SocketCategoryHashes } from 'data/d2/generated-enums';

export const getWeaponArchetypeSocket = (item: DimItem) =>
  (item.bucket.inWeapons &&
    !item.isExotic &&
    item.sockets?.categories.find((c) => c.category.hash === SocketCategoryHashes.IntrinsicTraits)
      ?.sockets[0]) ||
  undefined;

export const getWeaponArchetype = (item: DimItem) =>
  getWeaponArchetypeSocket(item)?.plugged?.plugDef;
