import { D2Item } from 'app/inventory/item-types';
import { SocketCategoryHashes } from 'data/d2/generated-enums';

export const getWeaponArchetypeSocket = (item: D2Item) =>
  (item.bucket.inWeapons &&
    !item.isExotic &&
    item.sockets?.categories.find((c) => c.category.hash === SocketCategoryHashes.IntrinsicTraits)
      ?.sockets[0]) ||
  undefined;

export const getWeaponArchetype = (item: D2Item) =>
  getWeaponArchetypeSocket(item)?.plugged?.plugDef;
