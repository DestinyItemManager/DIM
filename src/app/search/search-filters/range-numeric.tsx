import { tl } from 'app/i18next-t';
import { getItemKillTrackerInfo, getItemYear } from 'app/utils/item-utils';
import { FilterDefinition } from '../filter-types';

const simpleRangeFilters: FilterDefinition[] = [
  {
    keywords: 'stack',
    description: tl('Filter.StackLevel'),
    format: 'range',
    filter:
      ({ compare }) =>
      (item) =>
        compare!(item.amount),
  },
  {
    keywords: 'year',
    description: tl('Filter.Year'),
    format: 'range',
    filter:
      ({ compare }) =>
      (item) =>
        compare!(getItemYear(item) ?? 0),
  },
  {
    keywords: 'level',
    destinyVersion: 1,
    description: tl('Filter.RequiredLevel'),
    format: 'range',
    filter:
      ({ compare }) =>
      (item) =>
        compare!(item.equipRequiredLevel),
  },
  {
    keywords: 'kills',
    description: tl('Filter.MasterworkKills'),
    format: ['range', 'stat'],
    destinyVersion: 2,
    suggestionKeywords: ['pve', 'pvp', 'gambit'],
    validateStat: () => (stat) => ['pve', 'pvp', 'gambit'].includes(stat),
    filter:
      ({ filterValue, compare }) =>
      (item) => {
        const killTrackerInfo = getItemKillTrackerInfo(item);
        return Boolean(
          killTrackerInfo &&
            (!filterValue.length || filterValue === killTrackerInfo.type) &&
            compare!(killTrackerInfo.count)
        );
      },
  },
  {
    keywords: 'weaponlevel',
    description: tl('Filter.WeaponLevel'),
    format: 'range',
    destinyVersion: 2,
    filter:
      ({ compare }) =>
      (item) =>
        Boolean(item.craftedInfo) && compare!(item.craftedInfo?.level || 0),
  },
];

export default simpleRangeFilters;
