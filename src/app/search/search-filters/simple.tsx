import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { isSunset } from 'app/utils/item-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import { FilterDefinition } from '../filter-types';

export function isWeapon(item: DimItem): boolean {
  return (
    item.bucket?.sort === 'Weapons' &&
    item.bucket.hash !== BucketHashes.SeasonalArtifact &&
    item.bucket.hash !== BucketHashes.Subclass
  );
}

// simple checks against check an attribute found on DimItem
const simpleFilters: FilterDefinition[] = [
  {
    keywords: 'armor2.0',
    description: tl('Filter.Energy'),
    destinyVersion: 2,
    filter: () => (item: DimItem) => Boolean(item.energy) && item.bucket.inArmor,
  },
  {
    keywords: 'weapon',
    description: tl('Filter.Weapon'),
    filter: () => (item) => isWeapon(item),
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
    description: tl('Filter.IsSunset'),
    filter: () => isSunset,
  },
];

export default simpleFilters;
