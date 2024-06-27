import { tl } from 'app/i18next-t';
import { BucketHashes } from 'data/d2/generated-enums';
import { ItemFilterDefinition } from '../item-filter-types';

// simple checks against check an attribute found on DimItem
const simpleFilters: ItemFilterDefinition[] = [
  {
    keywords: 'armor2.0',
    description: tl('Filter.Energy'),
    destinyVersion: 2,
    filter: () => (item) => Boolean(item.energy) && item.bucket.inArmor,
  },
  {
    keywords: 'weapon',
    description: tl('Filter.Weapon'),
    filter: () => (item) =>
      item.bucket?.sort === 'Weapons' &&
      item.bucket.hash !== BucketHashes.SeasonalArtifact &&
      item.bucket.hash !== BucketHashes.Subclass,
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
    keywords: 'stackfull',
    description: tl('Filter.StackFull'),
    filter: () => (item) => item.maxStackSize > 1 && item.amount === item.maxStackSize,
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
    filter:
      ({ newItems }) =>
      (item) =>
        newItems.has(item.id),
  },
  {
    keywords: 'sunset',
    destinyVersion: 2,
    description: tl('Filter.Deprecated'),
    deprecated: true,
    filter: () => () => false,
  },
  {
    keywords: ['crafted', 'shaped'],
    destinyVersion: 2,
    description: tl('Filter.IsCrafted'),
    filter: () => (item) => item.crafted === 'crafted',
  },
  {
    keywords: ['vendor'],
    destinyVersion: 2,
    description: tl('Filter.VendorItem'),
    filter: () => (item) => Boolean(item.vendor),
  },
];

export default simpleFilters;
