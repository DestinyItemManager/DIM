import { damageTypeNames } from 'app/inventory/store/d2-item-factory';
import { DimItem, DimSocket } from 'app/inventory/item-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DestinyDamageTypeDefinition } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import memoizeOne from 'memoize-one';
import modSlotsByName from 'data/d2/seasonal-mod-slots.json';

// a file for utilities where item goes in, info about the item comes out.
// but not necessarily info worth wedging into the DimItem

const dmgToEnum = _.invert(damageTypeNames);
const generateEnumToDef: (
  defs: D2ManifestDefinitions
) => { [key: number]: DestinyDamageTypeDefinition } = memoizeOne((defs) =>
  Object.values(defs.DamageType.getAll()).reduce((obj, dt) => {
    obj[dt.enumValue] = dt;
    return obj;
  }, {})
);
/** convert DimItem's .dmg back to a DamageType */
export const getItemDamageType: (
  item: DimItem,
  defs: D2ManifestDefinitions
) => DestinyDamageTypeDefinition | null = (item, defs) => {
  const enumToDef = generateEnumToDef(defs);
  return (item.dmg && dmgToEnum[item.dmg] && enumToDef[dmgToEnum[item.dmg]]) || null;
};

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
