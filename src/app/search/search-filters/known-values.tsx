import { DimItem, D2Item } from 'app/inventory/item-types';
import { FilterDefinition } from '../filter-types';
import { getItemDamageShortName } from 'app/utils/item-utils';
import { DestinyAmmunitionType, DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import { cosmeticTypes, damageTypeNames, lightStats } from '../search-filter-values';
import { D2EventPredicateLookup } from 'data/d2/d2-event-info';
import D2Sources from 'data/d2/source-info';
import missingSources from 'data/d2/missing-source-info';
import { D1ItemCategoryHashes } from '../d1-known-values';
import { breakerTypes, D2ItemCategoryHashesByName, powerfulSources } from '../d2-known-values';
import { D2Categories } from 'app/destiny2/d2-buckets';

const tierMap = {
  white: 'common',
  green: 'uncommon',
  blue: 'rare',
  purple: 'legendary',
  yellow: 'exotic',
};
const d2AmmoTypes = {
  primary: DestinyAmmunitionType.Primary,
  special: DestinyAmmunitionType.Special,
  heavy: DestinyAmmunitionType.Heavy,
};
const classes = ['titan', 'hunter', 'warlock'];

const itemCategoryHashesByName: { [key: string]: number } = {
  ...D1ItemCategoryHashes,
  ...D2ItemCategoryHashesByName,
};

// filters relying on curated known values
const knownValuesFilters: FilterDefinition[] = [
  {
    keywords: [
      'common',
      'uncommon',
      'rare',
      'legendary',
      'exotic',
      'white',
      'green',
      'blue',
      'purple',
      'yellow',
    ],
    description: ['Filter.RarityTier'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem, filterValue: string) =>
      item.tier.toLowerCase() === (filterValue || tierMap[filterValue]),
  },
  {
    keywords: ['special', 'primary', 'heavy'],
    description: ['Filter.AmmoType'],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item, filterValue: string) =>
      item.ammoType === d2AmmoTypes[filterValue],
  },
  {
    keywords: ['titan', 'hunter', 'warlock'],
    description: ['Filter.Class'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem, filterValue: string) =>
      !item.classified && item.classType === classes.indexOf(filterValue),
  },
  {
    keywords: ['reacquirable'],
    description: ['Filter.Reacquirable'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) =>
      Boolean(
        item.isDestiny2() &&
          item.collectibleState !== null &&
          !(item.collectibleState & DestinyCollectibleState.NotAcquired) &&
          !(item.collectibleState & DestinyCollectibleState.PurchaseDisabled)
      ),
  },
  {
    keywords: ['cosmetic'],
    description: ['Filter.Categories'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => cosmeticTypes.includes(item.type),
  },
  {
    keywords: ['light', 'haslight', 'haspower'],
    description: ['Filter.ContributeLight'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem) => item.primStat && lightStats.includes(item.primStat.statHash),
  },
  {
    keywords: ['breaker'],
    description: ['Filter.Breaker'],
    format: 'query',
    suggestionsGenerator: Object.keys(breakerTypes),
    destinyVersion: 2,
    filterFunction: (item: D2Item, filterValue: string) =>
      item.breakerType && breakerTypes[filterValue] === item.breakerType.hash,
  },
  {
    keywords: damageTypeNames,
    description: ['Filter.DamageType'],
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem, filterValue: string) =>
      getItemDamageShortName(item) === filterValue,
  },
  {
    keywords: Object.values(D2Categories)
      .flat()
      .map((v) => v.toLowerCase()),
    description: ['Filter.ArmorCategory'], // or 'Filter.WeaponClass'
    format: 'simple',
    destinyVersion: 0,
    filterFunction: (item: DimItem, filterValue: string) =>
      item.type?.toLowerCase() === filterValue,
  },
  {
    keywords: Object.keys({
      ...D1ItemCategoryHashes,
      ...D2ItemCategoryHashesByName,
    }),
    description: ['Filter.WeaponType'],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item, filterValue: string) => {
      const categoryHash = itemCategoryHashesByName[filterValue.replace(/\s/g, '')];

      if (!categoryHash) {
        return false;
      }
      return item.itemCategoryHashes.includes(categoryHash);
    },
  },
  {
    keywords: ['powerfulreward'],
    description: ['Filter.PowerfulReward'],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item) =>
      item.pursuit?.rewards.some((r) => powerfulSources.includes(r.itemHash)),
  },
  {
    keywords: ['source'],
    description: ['Filter.Event'], // or 'Filter.Source'
    format: 'query',
    suggestionsGenerator: [...Object.keys(D2Sources), ...Object.keys(D2EventPredicateLookup)],
    destinyVersion: 2,
    filterFunction: (item: D2Item, filterValue: string) => {
      if (!item && (!D2Sources[filterValue] || !D2EventPredicateLookup[filterValue])) {
        return false;
      }
      if (D2Sources[filterValue]) {
        return (
          (item.source && D2Sources[filterValue].sourceHashes.includes(item.source)) ||
          D2Sources[filterValue].itemHashes.includes(item.hash) ||
          missingSources[filterValue]?.includes(item.hash)
        );
      } else if (D2EventPredicateLookup[filterValue]) {
        return D2EventPredicateLookup[filterValue] === item?.event;
      }
      return false;
    },
  },
];

export default knownValuesFilters;
