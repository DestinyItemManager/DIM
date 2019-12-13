import { damageTypeNames } from 'app/inventory/store/d2-item-factory';
import { DimItem } from 'app/inventory/item-types';
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

const allSeasonalModSocketHashes = Object.values(modSlotsByName).flat();
/** the name says it all */
export const getItemSeasonalModSlotName: (item: DimItem) => string = (item) => {
  if (!item.isDestiny2() || !item.sockets || !(item.bucket?.sort === 'Armor')) {
    return '';
  }
  const seasonalSocket = item.sockets.sockets.find((socket) =>
    allSeasonalModSocketHashes.includes(socket?.plug?.plugItem?.plug?.plugCategoryHash ?? -99999999)
  );
  return (
    (seasonalSocket &&
      Object.keys(modSlotsByName).find(
        (key) =>
          key !== 'any' &&
          modSlotsByName[key].includes(seasonalSocket.plug!.plugItem.plug.plugCategoryHash)
      )) ??
    ''
  );
};
