import { DamageType, DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { DimItem, DimSocket } from 'app/inventory/item-types';

import modMetadataBySlotTag from 'data/d2/specialty-modslot-metadata.json';

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

export const getItemDamageShortName: (item: DimItem) => string | undefined = (item) =>
  item.isDestiny2() && item.energy
    ? energyNamesByEnum[item.element?.enumValue ?? -1]
    : damageNamesByEnum[item.element?.enumValue ?? -1];

// kind of silly but we are using a list of known hashes to identify specialty mod slots below
const specialtyModSocketHashes = Object.values(modMetadataBySlotTag)
  .map((modMetadata) => modMetadata.thisSlotPlugCategoryHashes)
  .flat();

/** verifies an item is d2 armor and has a specialty mod slot, which is returned */
export const getSpecialtySocket: (item: DimItem) => DimSocket | undefined = (item) =>
  (item.isDestiny2() &&
    item.bucket?.sort === 'Armor' &&
    item.sockets?.sockets.find((socket) =>
      specialtyModSocketHashes.includes(socket?.plug?.plugItem?.plug?.plugCategoryHash ?? -99999999)
    )) ||
  undefined;

/** just gives you the hash that defines what socket a plug can fit into */
export const getSpecialtySocketCategoryHash: (item: DimItem) => number | undefined = (item) =>
  getSpecialtySocket(item)?.plug?.plugItem.plug.plugCategoryHash;

/** this returns a string for easy printing purposes. '' if not found */
export const getItemSpecialtyModSlotDisplayName: (item: DimItem) => string = (item) =>
  getSpecialtySocket(item)?.plug!.plugItem.itemTypeDisplayName || '';
