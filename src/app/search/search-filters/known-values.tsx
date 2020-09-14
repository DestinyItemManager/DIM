import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { tl } from 'app/i18next-t';
import { D2Item } from 'app/inventory/item-types';
import { getEvent } from 'app/inventory/store/season';
import { getItemDamageShortName } from 'app/utils/item-utils';
import { DestinyAmmunitionType } from 'bungie-api-ts/destiny2';
import { D2EventPredicateLookup } from 'data/d2/d2-event-info';
import missingSources from 'data/d2/missing-source-info';
import D2Sources from 'data/d2/source-info';
import _ from 'lodash';
import { D1ItemCategoryHashes } from '../d1-known-values';
import { breakerTypes, D2ItemCategoryHashesByName, powerfulSources } from '../d2-known-values';
import { FilterDefinition } from '../filter-types';
import { cosmeticTypes, damageTypeNames, lightStats } from '../search-filter-values';

const tierMap = {
  white: 'Common',
  green: 'Uncommon',
  blue: 'Rare',
  purple: 'Legendary',
  yellow: 'Exotic',
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
  exotic: 'Exotic',
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
    description: tl('Filter.RarityTier'),
    filter: ({ filterValue }) => {
      filterValue = tierMap[filterValue];
      if (!filterValue) {
        // TODO: throw an error!
        return _.stubFalse;
      }
      return (item) => item.tier === filterValue;
    },
  },
  {
    keywords: ['special', 'primary', 'heavy'],
    description: tl('Filter.AmmoType'),
    destinyVersion: 2,
    filter: ({ filterValue }) => {
      const ammoType = d2AmmoTypes[filterValue];
      return (item: D2Item) => item.ammoType === ammoType;
    },
  },
  {
    keywords: ['titan', 'hunter', 'warlock'],
    description: tl('Filter.Class'),
    filter: ({ filterValue }) => {
      const classType = classes.indexOf(filterValue);
      return (item) => !item.classified && item.classType === classType;
    },
  },
  {
    keywords: 'cosmetic',
    description: tl('Filter.Cosmetic'),
    filter: () => (item) => cosmeticTypes.includes(item.type),
  },
  {
    keywords: ['light', 'haslight', 'haspower'],
    description: tl('Filter.ContributePower'),
    filter: () => (item) => item.primStat && lightStats.includes(item.primStat.statHash),
  },
  {
    keywords: 'breaker',
    description: tl('Filter.Breaker'),
    format: 'query',
    suggestions: Object.keys(breakerTypes),
    destinyVersion: 2,
    filter: ({ filterValue }) => {
      const breakerType = breakerTypes[filterValue];
      if (!breakerType) {
        // TODO: throw an error!
        return _.stubFalse;
      }
      return (item) => item.breakerType?.hash === breakerType;
    },
  },
  {
    keywords: damageTypeNames,
    description: tl('Filter.DamageType'),
    filter: ({ filterValue }) => (item) => getItemDamageShortName(item) === filterValue,
  },
  {
    keywords: Object.values(D2Categories)
      .flat()
      .map((v) => v.toLowerCase()),
    description: tl('Filter.ArmorCategory'), // or 'Filter.WeaponClass'
    filter: ({ filterValue }) => (item) => item.type?.toLowerCase() === filterValue,
  },
  {
    keywords: Object.keys(itemCategoryHashesByName),
    description: tl('Filter.WeaponType'),
    destinyVersion: 2,
    filter: ({ filterValue }) => {
      const categoryHash = itemCategoryHashesByName[filterValue.replace(/\s/g, '')];
      if (!categoryHash) {
        // TODO: throw an error!
        return _.stubFalse;
      }
      return (item) => item.itemCategoryHashes.includes(categoryHash);
    },
  },
  {
    keywords: 'powerfulreward',
    description: tl('Filter.PowerfulReward'),
    destinyVersion: 2,
    filter: () => (item) => item.pursuit?.rewards.some((r) => powerfulSources.includes(r.itemHash)),
  },
  {
    keywords: 'source',
    description: tl('Filter.Event'), // or 'Filter.Source'
    format: 'query',
    suggestions: [...Object.keys(D2Sources), ...Object.keys(D2EventPredicateLookup)],
    destinyVersion: 2,
    filter: ({ filterValue }) => {
      if (D2Sources[filterValue]) {
        const sourceInfo = D2Sources[filterValue];
        const missingSource = missingSources[filterValue];
        return (item) =>
          (item.source && sourceInfo.sourceHashes.includes(item.source)) ||
          sourceInfo.itemHashes.includes(item.hash) ||
          missingSource?.includes(item.hash);
      } else if (D2EventPredicateLookup[filterValue]) {
        const predicate = D2EventPredicateLookup[filterValue];
        return (item: D2Item) => getEvent(item) === predicate;
      } else {
        // TODO: throw an error!
        return _.stubFalse;
      }
    },
  },
];

export default knownValuesFilters;
