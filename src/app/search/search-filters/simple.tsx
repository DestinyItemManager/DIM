import { tl } from 'app/i18next-t';
import { D2Item } from 'app/inventory/item-types';
import { FilterDefinition } from '../filter-types';

const newItems: Set<string> = new Set();

// simple checks against check an attribute found on DimItem
const simpleFilters: FilterDefinition[] = [
  {
    keywords: ['hascapacity', 'armor2.0'],
    description: tl('Filter.Energy'),
    destinyVersion: 2,
    filterFunction: () => (item: D2Item) => Boolean(item.energy),
  },
  {
    keywords: 'weapon',
    description: tl('Filter.Categories'),
    filterFunction: () => (item) =>
      item.bucket?.sort === 'Weapons' &&
      item.bucket.type !== 'SeasonalArtifacts' &&
      item.bucket.type !== 'Class',
  },
  {
    keywords: 'armor',
    description: tl('Filter.Categories'),
    filterFunction: () => (item) => item.bucket?.sort === 'Armor',
  },
  {
    keywords: ['equipment', 'equippable'],
    description: tl('Filter.Equipment'),
    filterFunction: () => (item) => item.equipment,
  },
  {
    keywords: ['postmaster', 'inpostmaster'],
    description: tl('Filter.Postmaster'),
    filterFunction: () => (item) => item.location?.inPostmaster,
  },
  {
    keywords: 'equipped',
    description: tl('Filter.Equipped'),
    filterFunction: () => (item) => item.equipped,
  },
  {
    keywords: ['transferable', 'movable'],
    description: tl('Filter.Transferable'),
    filterFunction: () => (item) => !item.notransfer,
  },
  {
    keywords: 'stackable',
    description: tl('Filter.Stackable'),
    filterFunction: () => (item) => item.maxStackSize > 1,
  },
  {
    keywords: ['infusable', 'infuse'],
    description: tl('Filter.Infusable'),
    filterFunction: () => (item) => item.infusable,
  },
  {
    keywords: 'locked',
    description: tl('Filter.Locked'),
    filterFunction: () => (item) => item.locked,
  },
  {
    keywords: 'unlocked',
    description: tl('Filter.Locked'),
    filterFunction: () => (item) => !item.locked,
  },
  {
    keywords: ['masterwork', 'masterworks'],
    description: tl('Filter.RarityTier'),
    filterFunction: () => (item) => item.masterwork,
  },
  {
    keywords: 'new',
    description: tl('Filter.NewItems'),
    filterFunction: () => (item) => newItems.has(item.id),
  },
];

export default simpleFilters;
