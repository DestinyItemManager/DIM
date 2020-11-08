import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { getItemPowerCapFinalSeason } from 'app/utils/item-utils';
import { D2CalculatedSeason } from 'data/d2/d2-season-info';
import { FilterDefinition } from '../filter-types';

// simple checks against check an attribute found on DimItem
const simpleFilters: FilterDefinition[] = [
  {
    keywords: ['hascapacity', 'armor2.0'],
    description: tl('Filter.Energy'),
    destinyVersion: 2,
    filter: () => (item: DimItem) => Boolean(item.energy),
  },
  {
    keywords: 'weapon',
    description: tl('Filter.Weapon'),
    filter: () => (item) =>
      item.bucket?.sort === 'Weapons' &&
      item.bucket.type !== 'SeasonalArtifacts' &&
      item.bucket.type !== 'Class',
  },
  {
    keywords: 'armor',
    description: tl('Filter.Armor'),
    filter: () => (item) => item.bucket?.sort === 'Armor',
  },
  {
    keywords: ['equipment', 'equippable'],
    description: tl('Filter.Equipment'),
    filter: () => (item) => item.equipment,
  },
  {
    keywords: ['postmaster', 'inpostmaster'],
    description: tl('Filter.Postmaster'),
    filter: () => (item) => item.location?.inPostmaster,
  },
  {
    keywords: 'equipped',
    description: tl('Filter.Equipped'),
    filter: () => (item) => item.equipped,
  },
  {
    keywords: ['transferable', 'movable'],
    description: tl('Filter.Transferable'),
    filter: () => (item) => !item.notransfer,
  },
  {
    keywords: 'stackable',
    description: tl('Filter.Stackable'),
    filter: () => (item) => item.maxStackSize > 1,
  },
  {
    keywords: ['infusable', 'infuse'],
    description: tl('Filter.Infusable'),
    filter: () => (item) => item.infusable,
  },
  {
    keywords: 'locked',
    description: tl('Filter.Locked'),
    filter: () => (item) => item.locked,
  },
  {
    keywords: 'unlocked',
    description: tl('Filter.Locked'),
    filter: () => (item) => !item.locked,
  },
  {
    keywords: 'new',
    description: tl('Filter.NewItems'),
    filter: ({ newItems }) => (item) => newItems.has(item.id),
  },
  {
    keywords: 'sunset',
    description: tl('Filter.IsSunset'),
    filter: () => (item) => {
      const sunsetSeason = getItemPowerCapFinalSeason(item);
      return sunsetSeason !== undefined && D2CalculatedSeason >= sunsetSeason + 1;
    },
  },
];

export default simpleFilters;
