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
    suggestions: ['pve', 'pvp'],
    validateStat: (stat) => ['pve', 'pvp'].includes(stat),
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
];

export default simpleRangeFilters;
