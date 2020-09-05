import { RootState } from 'app/store/types';
import { Settings } from './initial-settings';
import { settingsSelector } from './reducer';

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
