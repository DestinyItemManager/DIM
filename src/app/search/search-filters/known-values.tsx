import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { tl } from 'app/i18next-t';
import { D2Item, DimItem } from 'app/inventory/item-types';
import { getItemDamageShortName } from 'app/utils/item-utils';
import { DestinyAmmunitionType } from 'bungie-api-ts/destiny2';
import { D2EventPredicateLookup } from 'data/d2/d2-event-info';
import missingSources from 'data/d2/missing-source-info';
import D2Sources from 'data/d2/source-info';
import { D1ItemCategoryHashes } from '../d1-known-values';
import { breakerTypes, D2ItemCategoryHashesByName, powerfulSources } from '../d2-known-values';
import { FilterDefinition } from '../filter-types';
import { cosmeticTypes, damageTypeNames, lightStats } from '../search-filter-values';

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
    description: [tl('Filter.RarityTier')],
    format: 'simple',
    filterFunction: (item: DimItem, filterValue: string) =>
      item.tier.toLowerCase() === (filterValue || tierMap[filterValue]),
  },
  {
    keywords: ['special', 'primary', 'heavy'],
    description: [tl('Filter.AmmoType')],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item, filterValue: string) =>
      item.ammoType === d2AmmoTypes[filterValue],
  },
  {
    keywords: ['titan', 'hunter', 'warlock'],
    description: [tl('Filter.Class')],
    format: 'simple',
    filterFunction: (item: DimItem, filterValue: string) =>
      !item.classified && item.classType === classes.indexOf(filterValue),
  },
  {
    keywords: ['cosmetic'],
    description: [tl('Filter.Categories')],
    format: 'simple',
    filterFunction: (item: DimItem) => cosmeticTypes.includes(item.type),
  },
  {
    keywords: ['light', 'haslight', 'haspower'],
    description: [tl('Filter.ContributeLight')],
    format: 'simple',
    filterFunction: (item: DimItem) => item.primStat && lightStats.includes(item.primStat.statHash),
  },
  {
    keywords: ['breaker'],
    description: [tl('Filter.Breaker')],
    format: 'query',
    suggestionsGenerator: Object.keys(breakerTypes),
    destinyVersion: 2,
    filterFunction: (item: D2Item, filterValue: string) =>
      item.breakerType && breakerTypes[filterValue] === item.breakerType.hash,
  },
  {
    keywords: damageTypeNames,
    description: [tl('Filter.DamageType')],
    format: 'simple',
    filterFunction: (item: DimItem, filterValue: string) =>
      getItemDamageShortName(item) === filterValue,
  },
  {
    keywords: Object.values(D2Categories)
      .flat()
      .map((v) => v.toLowerCase()),
    description: [tl('Filter.ArmorCategory')], // or 'Filter.WeaponClass'
    format: 'simple',
    filterFunction: (item: DimItem, filterValue: string) =>
      item.type?.toLowerCase() === filterValue,
  },
  {
    keywords: Object.keys(itemCategoryHashesByName),
    description: [tl('Filter.WeaponType')],
    format: 'simple',
    destinyVersion: 2,
    filterValuePreprocessor: (filterValue) => filterValue.replace(/\s/g, ''),
    filterFunction: (item: D2Item, filterValue: string) => {
      const categoryHash = itemCategoryHashesByName[filterValue];
      if (!categoryHash) {
        return false;
      }
      return item.itemCategoryHashes.includes(categoryHash);
    },
  },
  {
    keywords: ['powerfulreward'],
    description: [tl('Filter.PowerfulReward')],
    format: 'simple',
    destinyVersion: 2,
    filterFunction: (item: D2Item) =>
      item.pursuit?.rewards.some((r) => powerfulSources.includes(r.itemHash)),
  },
  {
    keywords: ['source'],
    description: [tl('Filter.Event')], // or 'Filter.Source'
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
