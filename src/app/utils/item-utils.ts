import {
  DamageType,
  DestinyEnergyType,
  DestinyInventoryItemDefinition
} from 'bungie-api-ts/destiny2';
import { DimItem, DimSocket } from 'app/inventory/item-types';

import modMetadataBySlotTag from 'data/d2/specialty-modslot-metadata.json';
import { objectifyArray } from './util';

// damage is a mess!
// this section supports turning a destiny DamageType or EnergyType into a known english name
// mainly for most css purposes and the filter names
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

export const Armor2ModPlugCategories = {
  general: 2487827355,
  helmet: 2912171003,
  gauntlets: 3422420680,
  chest: 1526202480,
  leg: 2111701510,
  classitem: 912441879
} as const;

export const getItemDamageShortName = (item: DimItem): string | undefined =>
  item.isDestiny2() && item.energy
    ? energyNamesByEnum[item.element?.enumValue ?? -1]
    : damageNamesByEnum[item.element?.enumValue ?? -1];

// these are helpers for identifying SpecialtySockets (seasonal mods).
// also sort of a mess because mod sockets and mod plugs don't have a direct
// string/hash to check their compatibility with each other i think??

// i would like this file to be the only one that interfaces with
// data/d2/specialty-modslot-metadata.json
// process its data here and export it to thing that needs it
interface ModMetadata {
  season: number;
  tag: string;
  compatibleTags: string[];
  thisSlotPlugCategoryHashes: number[];
  compatiblePlugCategoryHashes: number[];
  emptyModSocketHashes: number[];
}
const modMetadataIndexedByEmptySlotHash = objectifyArray(
  modMetadataBySlotTag as ModMetadata[],
  'emptyModSocketHashes'
);

/** i.e. ['outlaw', 'forge', 'opulent', etc] */
export const modSlotTags = modMetadataBySlotTag.map((m) => m.tag);

// kind of silly but we are using a list of known mod hashes to identify specialty mod slots below
export const specialtyModSocketHashes = Object.values(modMetadataBySlotTag)
  .map((modMetadata) => modMetadata.thisSlotPlugCategoryHashes)
  .flat();

/** verifies an item is d2 armor and has a specialty mod slot, which is returned */
export const getSpecialtySocket = (item: DimItem): DimSocket | undefined =>
  (item.isDestiny2() &&
    item.bucket?.sort === 'Armor' &&
    item.sockets?.sockets.find((socket) =>
      specialtyModSocketHashes.includes(socket?.plug?.plugItem?.plug?.plugCategoryHash ?? -99999999)
    )) ||
  undefined;

/** just gives you the hash that defines what socket a plug can fit into */
export const getSpecialtySocketCategoryHash = (item: DimItem): number | undefined =>
  getSpecialtySocket(item)?.socketDefinition.singleInitialItemHash;

/** returns ModMetadata if the item has a specialty mod slot */
export const getSpecialtySocketMetadata = (item: DimItem): ModMetadata | undefined =>
  modMetadataIndexedByEmptySlotHash[
    getSpecialtySocket(item)?.socketDefinition.singleInitialItemHash || -99999999
  ];

/** this returns a string for easy printing purposes. '' if not found */
export const getItemSpecialtyModSlotDisplayName = (item: DimItem) =>
  getSpecialtySocket(item)?.plug?.plugItem.itemTypeDisplayName || '';

export const isArmor2Mod = (item: DestinyInventoryItemDefinition): boolean =>
  Object.values(Armor2ModPlugCategories).some(
    (category) => category === item.plug.plugCategoryHash
  ) || specialtyModSocketHashes.includes(item.plug.plugCategoryHash);
