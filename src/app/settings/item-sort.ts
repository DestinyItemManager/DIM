import { RootState } from '../store/reducers';
import { Settings } from './reducer';

const itemSortPresets = {
  primaryStat: ['primStat', 'name'],
  basePowerThenPrimary: ['basePower', 'primStat', 'name'],
  rarityThenPrimary: ['rarity', 'primStat', 'name'],
  quality: ['rating', 'name'],
  name: ['name'],
  typeThenPrimary: ['typeName', 'classType', 'primStat', 'name'],
  typeThenName: ['typeName', 'classType', 'name']
};

export const itemSortOrderSelector = (state: RootState) => itemSortOrder(state.settings);
export const itemSortOrder = (settings: Settings): string[] =>
  (settings.itemSort === 'custom'
    ? settings.itemSortOrderCustom
    : itemSortPresets[settings.itemSort]) || itemSortPresets.primaryStat;
