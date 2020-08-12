import { RootState } from 'app/store/types';
import { settingsSelector } from './reducer';
import { Settings } from './initial-settings';

const itemSortPresets = {
  primaryStat: ['primStat', 'name'],
  basePowerThenPrimary: ['basePower', 'primStat', 'name'],
  rarityThenPrimary: ['rarity', 'primStat', 'name'],
  quality: ['rating', 'name'],
  name: ['name'],
  typeThenPrimary: ['typeName', 'classType', 'primStat', 'name'],
  typeThenName: ['typeName', 'classType', 'name'],
};

export const itemSortOrder = (settings: Settings): string[] =>
  (settings.itemSort === 'custom'
    ? settings.itemSortOrderCustom
    : itemSortPresets[settings.itemSort]) || itemSortPresets.primaryStat;

export const itemSortOrderSelector = (state: RootState) => itemSortOrder(settingsSelector(state));
