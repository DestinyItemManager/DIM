import { DimItem, DimSocket } from 'app/inventory/item-types';
import modSlotsByName from 'data/d2/seasonal-mod-slots.json';
import { damageTypeNames } from 'app/inventory/store/d2-item-factory';
import { energyCapacityTypeNames } from 'app/item-popup/EnergyMeter';

// a file for utilities where item goes in, info about the item comes out.
// but not necessarily info worth wedging into the DimItem
export const getItemDamageShortName: (item: DimItem) => string | undefined = (item) =>
  item.bucket.inWeapons
    ? damageTypeNames[item.element?.enumValue ?? -1]
    : item.bucket.inArmor
    ? energyCapacityTypeNames[item.element?.enumValue ?? -1]
    : undefined;

// specialty slots are seasonal-ish, thus-far. some correspond to a season, some to an expansion
const specialtyModSocketHashes = Object.values(modSlotsByName).flat();
export const specialtyModSlotFilterNames = Object.keys(modSlotsByName);
/** verifies an item is d2 armor and has a specialty mod slot, which is returned */
export const getSpecialtySocket: (item: DimItem) => DimSocket | false = (item) =>
  (item.isDestiny2() &&
    item.bucket?.sort === 'Armor' &&
    item.sockets?.sockets.find((socket) =>
      specialtyModSocketHashes.includes(socket?.plug?.plugItem?.plug?.plugCategoryHash ?? -99999999)
    )) ??
  false;

/** returns a matched filter name or false if not found */
export const getItemSpecialtyModSlotFilterName: (item: DimItem) => string | false = (item) => {
  const specialtySocket = getSpecialtySocket(item);
  return (
    (specialtySocket &&
      specialtyModSlotFilterNames.find((key) =>
        modSlotsByName[key].includes(specialtySocket.plug!.plugItem.plug.plugCategoryHash)
      )) ||
    false
  );
};

/** this returns a string for easy printing purposes. '' if not found */
export const getItemSpecialtyModSlotDisplayName: (item: DimItem) => string = (item) => {
  const specialtySocket = getSpecialtySocket(item);
  return (specialtySocket && specialtySocket.plug!.plugItem.itemTypeDisplayName) || '';
};
