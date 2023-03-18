import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { bucketToType } from 'app/destiny2/d2-buckets';
import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { getEvent } from 'app/inventory/store/season';
import { getItemDamageShortName } from 'app/utils/item-utils';
import { DestinyAmmunitionType, DestinyClass, DestinyRecordState } from 'bungie-api-ts/destiny2';
import { D2EventEnum, D2EventPredicateLookup } from 'data/d2/d2-event-info';
import { BreakerTypeHashes } from 'data/d2/generated-enums';
import missingSources from 'data/d2/missing-source-info';
import D2Sources from 'data/d2/source-info';
import { D1ItemCategoryHashes } from '../d1-known-values';
import {
  breakerTypes,
  D2ItemCategoryHashesByName,
  ItemTierName,
  pinnacleSources,
  powerfulSources,
} from '../d2-known-values';
import { FilterDefinition } from '../filter-types';
import { cosmeticTypes, damageTypeNames } from '../search-filter-values';

const d2EventPredicates: { [event: string]: D2EventEnum | undefined } = D2EventPredicateLookup;

// filters relying on curated known values (class names, rarities, elements)

const tierMap: NodeJS.Dict<ItemTierName> = {
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

export const damageFilter: FilterDefinition = {
  keywords: damageTypeNames,
  description: tl('Filter.DamageType'),
  filter:
    ({ filterValue }) =>
    (item) =>
      getItemDamageShortName(item) === filterValue,
  fromItem: (item) => `is:${getItemDamageShortName(item)}`,
};

export const classFilter: FilterDefinition = {
  keywords: ['titan', 'hunter', 'warlock'],
  description: tl('Filter.Class'),
  filter: ({ filterValue }) => {
    const classType = classes.indexOf(filterValue);
    return (item) => !item.classified && item.classType === classType;
  },
  fromItem: (item) =>
    item.classType === DestinyClass.Unknown ? '' : `is:${classes[item.classType]}`,
};

export const itemTypeFilter: FilterDefinition = {
  keywords: Object.values(D2Categories) // stuff like Engrams, Kinetic, Gauntlets, Emblems, Finishers, Modifications
    .flat()
    .map((v) => {
      const type = bucketToType[v];
      if (!type && $DIM_FLAVOR === 'dev') {
        throw new Error(`You forgot to map a string type name for bucket hash ${v}`);
      }
      return type!.toLowerCase();
    }),
  description: tl('Filter.ArmorCategory'), // or 'Filter.WeaponClass'
  filter:
    ({ filterValue }) =>
    (item) =>
      item.type.toLowerCase() === filterValue,
  fromItem: (item) => `is:${item.type.toLowerCase()}`,
};

export const itemCategoryFilter: FilterDefinition = {
  keywords: Object.keys(itemCategoryHashesByName),
  description: tl('Filter.WeaponType'),
  filter: ({ filterValue }) => {
    const categoryHash = itemCategoryHashesByName[filterValue.replace(/\s/g, '')];
    if (!categoryHash) {
      throw new Error('Unknown weapon type ' + filterValue);
    }
    return (item) => item.itemCategoryHashes.includes(categoryHash);
  },
  fromItem: (item) => {
    /*
    The last ICH will be the most specific, so start there and try find a corresponding search
    filter. If we can't find one (e.g. for slug shotguns), try the next most specific ICH and so on.
    */
    for (let i = item.itemCategoryHashes.length - 1; i >= 0; i--) {
      const itemCategoryHash = item.itemCategoryHashes[i];
      const typeTag = Object.entries(itemCategoryHashesByName).find(
        ([_tag, ich]) => ich === itemCategoryHash
      )?.[0];
      if (typeTag) {
        return `is:${typeTag}`;
      }
    }
    return '';
  },
};

const knownValuesFilters: FilterDefinition[] = [
  damageFilter,
  classFilter,
  itemCategoryFilter,
  itemTypeFilter,
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
      const tierName = tierMap[filterValue];
      if (!tierName) {
        throw new Error('Unknown rarity type ' + filterValue);
      }
      return (item) => item.tier === tierName;
    },
  },
  {
    keywords: ['special', 'primary', 'heavy'],
    description: tl('Filter.AmmoType'),
    destinyVersion: 2,
    filter: ({ filterValue }) => {
      const ammoType = d2AmmoTypes[filterValue as keyof typeof d2AmmoTypes];
      return (item: DimItem) => item.ammoType === ammoType;
    },
  },
  {
    keywords: 'cosmetic',
    description: tl('Filter.Cosmetic'),
    filter: () => (item) => cosmeticTypes.includes(item.bucket.hash),
  },
  {
    keywords: ['haslight', 'haspower'],
    description: tl('Filter.ContributePower'),
    filter: () => (item) => item.power > 0,
  },
  {
    keywords: 'breaker',
    description: tl('Filter.Breaker'),
    format: 'query',
    suggestions: Object.keys(breakerTypes),
    destinyVersion: 2,
    filter: ({ filterValue }) => {
      const breakerType = breakerTypes[filterValue as keyof typeof breakerTypes];
      if (!breakerType) {
        throw new Error('Unknown breaker type ' + breakerType);
      }
      return (item) => breakerType.includes(item.breakerType?.hash as BreakerTypeHashes);
    },
  },
  {
    keywords: 'foundry',
    description: tl('Filter.Foundry'),
    format: 'query',
    suggestions: ['daito', 'hakke', 'omolon', 'suros', 'tex-mechanica', 'veist', 'any'],
    destinyVersion: 2,
    filter: ({ filterValue }) => {
      switch (filterValue) {
        case 'any':
          return (item) => Boolean(item.foundry);
        default:
          return (item) => item.foundry === filterValue;
      }
    },
  },
  {
    keywords: 'powerfulreward',
    description: tl('Filter.PowerfulReward'),
    destinyVersion: 2,
    filter: () => (item) => item.pursuit?.rewards.some((r) => powerfulSources.includes(r.itemHash)),
  },
  {
    keywords: 'pinnaclereward',
    description: tl('Filter.PinnacleReward'),
    destinyVersion: 2,
    filter: () => (item) => item.pursuit?.rewards.some((r) => pinnacleSources.includes(r.itemHash)),
  },
  {
    keywords: ['craftable'],
    description: tl('Filter.Craftable'),
    destinyVersion: 2,
    filter: () => (item) => Boolean(item.patternUnlockRecord),
  },
  {
    keywords: ['patternunlocked'],
    description: tl('Filter.PatternUnlocked'),
    destinyVersion: 2,
    filter: () => (item) =>
      item.patternUnlockRecord &&
      !(item.patternUnlockRecord.state & DestinyRecordState.ObjectiveNotCompleted),
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
      } else if (d2EventPredicates[filterValue]) {
        const predicate = d2EventPredicates[filterValue];
        return (item: DimItem) => getEvent(item) === predicate;
      } else {
        throw new Error('Unknown item source ' + filterValue);
      }
    },
  },
];

export default knownValuesFilters;
