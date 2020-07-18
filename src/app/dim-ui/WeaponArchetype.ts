import { D2Item } from 'app/inventory/item-types';

export const getWeaponArchetypeSocket = (item: D2Item) =>
  (item.bucket.inWeapons &&
    !item.isExotic &&
    item.sockets?.categories.find((c) => c.category.hash === 3956125808)?.sockets[0]) ||
  undefined;

export const getWeaponArchetype = (item: D2Item) => getWeaponArchetypeSocket(item)?.plug?.plugItem;
