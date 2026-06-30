import { tl } from 'app/i18next-t';
import { getCollectibleState } from 'app/records/presentation-nodes';
import { compact } from 'app/utils/collections';
import { isArmor3 } from 'app/utils/item-utils';
import { DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { ItemFilterDefinition } from '../item-filter-types';

// simple checks against check an attribute found on DimItem
const simpleFilters: ItemFilterDefinition[] = compact<ItemFilterDefinition | false>([
  {
    keywords: 'armor2.0',
    description: tl('Filter.Energy'),
    destinyVersion: 2,
    filter: () => (item) => Boolean(item.energy) && item.bucket.inArmor && !isArmor3(item),
  },
  {
    keywords: 'armor3.0',
    description: tl('Filter.Armor3'),
    destinyVersion: 2,
    filter: () => (item) => Boolean(item.energy) && item.bucket.inArmor && isArmor3(item),
  },
  {
    keywords: 'weapon',
    description: tl('Filter.Weapon'),
    filter: () => (item) =>
      item.bucket?.sort === 'Weapons' &&
      item.bucket.hash !== BucketHashes.Artifacts &&
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
    filter: () => (item) => item.lockable && item.locked,
  },
  {
    keywords: 'unlocked',
    description: tl('Filter.Locked'),
    filter: () => (item) => item.lockable && !item.locked,
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
  {
    keywords: 'ininventory',
    description: tl('Filter.InInventory'),
    filter: ({ allItems }) => {
      const ownedHashes = new Set(allItems.map((item) => item.hash));
      return (item) => ownedHashes.has(item.hash);
    },
  },
  {
    keywords: 'collected',
    description: tl('Filter.Collected'),
    destinyVersion: 2,
    filter: ({ allItems, d2Definitions, profileResponse }) => {
      const ownedHashes = new Set(allItems.map((i) => i.hash));
      return (item) => {
        // No collectible, or you own it (covers crafted exotics whose collectible isn't flagged acquired)
        if (!item.collectibleHash || ownedHashes.has(item.hash)) {
          return true;
        }
        const collectibleDef = d2Definitions!.Collectible.get(item.collectibleHash);
        const state = collectibleDef && getCollectibleState(collectibleDef, profileResponse!);
        return state !== undefined && !(state & DestinyCollectibleState.NotAcquired);
      };
    },
  },
]);

export default simpleFilters;
