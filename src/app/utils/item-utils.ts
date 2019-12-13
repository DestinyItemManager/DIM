import { damageTypeNames } from 'app/inventory/store/d2-item-factory';
import { DimItem, DimSocket } from 'app/inventory/item-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DestinyDamageTypeDefinition } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import memoizeOne from 'memoize-one';
import modSlotsByName from 'data/d2/seasonal-mod-slots.json';

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

/** */
const seasonalModSocketHashes = Object.values(modSlotsByName).flat();
export const seasonalModSlotFilterNames = Object.keys(modSlotsByName);

/** verifies an item is d2 armor and has a seasonal mod slot, which is returned */
const getSeasonalPlug: (item: DimItem) => DimSocket | false = (item) =>
  (item.isDestiny2() &&
    item.bucket?.sort === 'Armor' &&
    item.sockets?.sockets.find((socket) =>
      seasonalModSocketHashes.includes(socket?.plug?.plugItem?.plug?.plugCategoryHash ?? -99999999)
    )) ??
  false;

/** returns a matched filter name or false */
export const getItemSeasonalModSlotFilterName: (item: DimItem) => string | false = (item) => {
  const seasonalSocket = getSeasonalPlug(item);
  console.log(!!seasonalSocket);
  return (
    (seasonalSocket &&
      seasonalModSlotFilterNames.find((key) =>
        modSlotsByName[key].includes(seasonalSocket.plug!.plugItem.plug.plugCategoryHash)
      )) ||
    false
  );
};

/** this returns a string for easy printing purposes. '' if not found */
export const getItemSeasonalModSlotDisplayName: (item: DimItem) => string = (item) => {
  const seasonalSocket = getSeasonalPlug(item);
  return (seasonalSocket && seasonalSocket.plug!.plugItem.itemTypeDisplayName) || '';
};
