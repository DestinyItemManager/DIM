import { DimItem, DimSocket } from 'app/inventory/item-types';
import modSlotsByName from 'data/d2/seasonal-mod-slots.json';
import { DamageType, DestinyEnergyType } from 'bungie-api-ts/destiny2';

// damage is a mess!
export const damageNamesByEnum: { [key in DamageType]: string | null } = {
  0: null,
  1: 'kinetic',
  2: 'arc',
  3: 'solar',
  4: 'void',
  5: 'raid'
};
export const energyNamesByEnum: { [key in DestinyEnergyType]: string } = {
  [DestinyEnergyType.Any]: 'any',
  [DestinyEnergyType.Arc]: 'arc',
  [DestinyEnergyType.Thermal]: 'solar',
  [DestinyEnergyType.Void]: 'void'
};
// export const damageEnumsByName: { [key:string]: number } = _.invert(damageNamesByEnum) as {};
// export const energyEnumsByName: { [key:string]: number } = _.invert(energyNamesByEnum) as {};

export const getItemDamageShortName: (item: DimItem) => string | undefined = (item) =>
  item.isDestiny2() && item.energy
    ? energyNamesByEnum[item.element?.enumValue ?? -1]
    : damageNamesByEnum[item.element?.enumValue ?? -1];

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
