import { DimItem, D2Item } from 'app/inventory/item-types';
import { FilterDefinition } from '../filter-types';

const newItems: Set<string> = new Set();

// simple checks against check an attribute found on DimItem
const simpleFilters: FilterDefinition[] = [
  {
    keywords: ['hascapacity', 'armor2.0'],
    description: ['Filter.Energy'],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item) => Boolean(item.energy),
  },
  {
    keywords: ['weapon'],
    description: ['Filter.Categories'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) =>
      item.bucket?.sort === 'Weapons' &&
      item.bucket.type !== 'SeasonalArtifacts' &&
      item.bucket.type !== 'Class',
  },
  {
    keywords: ['armor'],
    description: ['Filter.Categories'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => item.bucket?.sort === 'Armor',
  },
  {
    keywords: ['equipment', 'equippable'],
    description: ['Filter.Equipment'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => item.equipment,
  },
  {
    keywords: ['postmaster', 'inpostmaster'],
    description: ['Filter.Postmaster'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => item.location?.inPostmaster,
  },
  {
    keywords: ['equipped'],
    description: ['Filter.Equipped'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => item.equipped,
  },
  {
    keywords: ['transferable', 'movable'],
    description: ['Filter.Transferable'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => !item.notransfer,
  },
  {
    keywords: ['stackable'],
    description: ['Filter.Stackable'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => item.maxStackSize > 1,
  },
  {
    keywords: ['infusable', 'infuse'],
    description: ['Filter.Infusable'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => item.infusable,
  },
  {
    keywords: ['locked'],
    description: ['Filter.Locked'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => item.locked,
  },
  {
    keywords: ['unlocked'],
    description: ['Filter.Locked'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => !item.locked,
  },
  {
    keywords: ['masterwork', 'masterworks'],
    description: ['Filter.RarityTier'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => item.masterwork,
  },
  {
    keywords: ['new'],
    description: ['Filter.NewItems'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => newItems.has(item.id),
  },
];

export default simpleFilters;
