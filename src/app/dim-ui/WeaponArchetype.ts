import { D2Item } from 'app/inventory/item-types';
import { INTRINSIC_TRAITS_SOCKET_CATEGORY } from 'app/search/d2-known-values';

export const getWeaponArchetypeSocket = (item: D2Item) =>
  (item.bucket.inWeapons &&
    !item.isExotic &&
    item.sockets?.categories.find((c) => c.category.hash === INTRINSIC_TRAITS_SOCKET_CATEGORY)
      ?.sockets[0]) ||
  undefined;

export const getWeaponArchetype = (item: D2Item) => getWeaponArchetypeSocket(item)?.plug?.plugItem;
