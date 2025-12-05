import { D1Categories } from 'app/destiny1/d1-bucket-categories';
import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { tl } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { getEvent } from 'app/inventory/store/season';
import { D1BucketHashes, D1ItemCategoryHashes } from 'app/search/d1-known-values';
import {
  D2ItemCategoryHashesByName,
  ItemRarityName,
  breakerTypes,
  pinnacleSources,
} from 'app/search/d2-known-values';
import { cosmeticTypes, damageTypeNames } from 'app/search/search-filter-values';
import { getItemDamageShortName } from 'app/utils/item-utils';
import { LookupTable } from 'app/utils/util-types';
import {
  DamageType,
  DestinyAmmunitionType,
  DestinyClass,
  DestinyRecordState,
} from 'bungie-api-ts/destiny2';
import artifactBreakerMods from 'data/d2/artifact-breaker-weapon-types.json';
import { D2EventEnum, D2EventInfo } from 'data/d2/d2-event-info-v2';
import focusingOutputs from 'data/d2/focusing-item-outputs.json';
import { BreakerTypeHashes, BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import powerfulSources from 'data/d2/powerful-rewards.json';
import { ItemFilterDefinition } from '../item-filter-types';
import D2Sources from './d2-sources';

const D2EventPredicateLookup = Object.fromEntries(
  Object.entries(D2EventInfo).map(([index, event]) => [
    event.shortname,
    Number(index) as D2EventEnum,
  ]),
);
// filters relying on curated known values (class names, rarities, elements)

/** Alternate search names for rarity tiers. */
const rarityMap: NodeJS.Dict<ItemRarityName> = {
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

export const d2AmmoTypes = {
  primary: DestinyAmmunitionType.Primary,
  special: DestinyAmmunitionType.Special,
  heavy: DestinyAmmunitionType.Heavy,
};
const classes = ['titan', 'hunter', 'warlock'];

const itemCategoryHashesByName: { [key: string]: number } = {
  ...D1ItemCategoryHashes,
  ...D2ItemCategoryHashesByName,
};

// Some common aliases for item categories
const itemCategoryAliases: LookupTable<string, string> = {
  lfr: 'linearfusionrifle',
  lmg: 'machinegun',
  smg: 'submachine',
} as const;

export const damageFilter = {
  keywords: damageTypeNames,
  description: tl('Filter.DamageType'),
  filter:
    ({ filterValue }) =>
    (item) =>
      getItemDamageShortName(item) === filterValue,
  fromItem: (item) => `is:${getItemDamageShortName(item)}`,
} satisfies ItemFilterDefinition;

const prismaticDamageLookupTable: { [key in DamageType]: string | undefined } = {
  [DamageType.None]: undefined,
  [DamageType.Kinetic]: undefined,
  [DamageType.Arc]: 'light',
  [DamageType.Thermal]: 'light',
  [DamageType.Void]: 'light',
  [DamageType.Raid]: undefined,
  [DamageType.Stasis]: 'dark',
  [DamageType.Strand]: 'dark',
};

const prismaticDamageFilter = {
  keywords: ['light', 'dark'],
  description: tl('Filter.PrismaticDamageType'),
  filter:
    ({ filterValue }) =>
    (item) => {
      const damageType = item.element?.enumValue ?? DamageType.None;
      return prismaticDamageLookupTable[damageType] === filterValue;
    },
} satisfies ItemFilterDefinition;

export const classFilter = {
  keywords: ['titan', 'hunter', 'warlock'],
  description: tl('Filter.Class'),
  filter: ({ filterValue }) => {
    const classType = classes.indexOf(filterValue);
    return (item) => !item.classified && item.classType === classType;
  },
  fromItem: (item) =>
    item.classType === DestinyClass.Unknown ? '' : `is:${classes[item.classType]}`,
} satisfies ItemFilterDefinition;

// A mapping from the bucket hash to DIM item types
const bucketToType: LookupTable<BucketHashes, string> = {
  [BucketHashes.Engrams]: 'engrams',
  [BucketHashes.LostItems]: 'lostitems',
  [BucketHashes.Messages]: 'messages',
  [BucketHashes.SpecialOrders]: 'specialorders',

  [BucketHashes.KineticWeapons]: 'kineticslot',
  [BucketHashes.EnergyWeapons]: 'energy',
  [BucketHashes.PowerWeapons]: 'power',

  [BucketHashes.Helmet]: 'helmet',
  [BucketHashes.Gauntlets]: 'gauntlets',
  [BucketHashes.ChestArmor]: 'chest',
  [BucketHashes.LegArmor]: 'leg',
  [BucketHashes.ClassArmor]: 'classitem',

  [BucketHashes.Subclass]: 'subclass',
  [BucketHashes.Ghost]: 'ghost',
  [BucketHashes.Emblems]: 'emblems',
  [BucketHashes.Ships]: 'ships',
  [BucketHashes.Vehicle]: 'vehicle',
  [BucketHashes.Emotes]: 'emotes',
  [BucketHashes.Finishers]: 'finishers',
  [BucketHashes.SeasonalArtifact]: 'seasonalartifacts',

  [BucketHashes.Accessories]: 'accessories',
  [BucketHashes.Consumables]: 'consumables',
  [BucketHashes.Modifications]: 'modifications',
};

const d1BucketToType: LookupTable<BucketHashes | D1BucketHashes, string> = {
  [BucketHashes.LostItems]: 'lostitems',
  [BucketHashes.SpecialOrders]: 'specialorders',
  [BucketHashes.Messages]: 'messages',

  [BucketHashes.KineticWeapons]: 'primary',
  [BucketHashes.EnergyWeapons]: 'special',
  [BucketHashes.PowerWeapons]: 'heavy',

  [BucketHashes.Helmet]: 'helmet',
  [BucketHashes.Gauntlets]: 'gauntlets',
  [BucketHashes.ChestArmor]: 'chest',
  [BucketHashes.LegArmor]: 'leg',
  [BucketHashes.ClassArmor]: 'classitem',

  [BucketHashes.Subclass]: 'subclass',
  [D1BucketHashes.Artifact]: 'artifact',
  [BucketHashes.Ghost]: 'ghost',
  [BucketHashes.Consumables]: 'consumables',
  [BucketHashes.Materials]: 'material',
  [BucketHashes.Modifications]: 'ornaments',
  [BucketHashes.Emblems]: 'emblems',
  [D1BucketHashes.Shader]: 'shader',
  [BucketHashes.Emotes]: 'emote',
  [BucketHashes.Ships]: 'ships',
  [BucketHashes.Vehicle]: 'vehicle',
  [D1BucketHashes.Horn]: 'horn',

  [D1BucketHashes.Bounties]: 'bounties',
  [D1BucketHashes.Quests]: 'quests',
  [D1BucketHashes.Missions]: 'missions',
  [D1BucketHashes.D1Emotes]: 'emotes',
};

export const itemTypeFilter = {
  keywords: Object.values(D2Categories) // stuff like Engrams, Kinetic, Gauntlets, Emblems, Finishers, Modifications
    .flat()
    .map((v) => {
      const type = bucketToType[v];
      if (!type && $DIM_FLAVOR === 'dev') {
        throw new Error(
          `itemTypeFilter: You forgot to map a string type name for bucket hash ${v}`,
        );
      }
      return type!;
    }),
  destinyVersion: 2,
  description: tl('Filter.ArmorCategory'), // or 'Filter.WeaponClass'
  filter: ({ filterValue }) => {
    let bucketHash: BucketHashes;
    for (const [bucketHashStr, type] of Object.entries(bucketToType)) {
      if (type === filterValue) {
        bucketHash = parseInt(bucketHashStr, 10);
        break;
      }
    }
    return (item) => item.bucket.hash === bucketHash;
  },
  fromItem: (item) => `is:${bucketToType[item.bucket.hash as BucketHashes]}`,
} satisfies ItemFilterDefinition;

// D1 has different item types, otherwise this is the same as itemTypeFilter.
const d1itemTypeFilter = {
  keywords: Object.values(D1Categories) // stuff like Engrams, Kinetic, Gauntlets, Emblems, Finishers, Modifications
    .flat()
    .map((v) => {
      const type = d1BucketToType[v];
      if (!type && $DIM_FLAVOR === 'dev') {
        throw new Error(
          `d1itemTypeFilter You forgot to map a string type name for bucket hash ${v}`,
        );
      }
      return type!;
    }),
  destinyVersion: 1,
  description: tl('Filter.ArmorCategory'), // or 'Filter.WeaponClass'
  filter: ({ filterValue }) => {
    let bucketHash: BucketHashes | D1BucketHashes;
    for (const [bucketHashStr, type] of Object.entries(d1BucketToType)) {
      if (type === filterValue) {
        bucketHash = parseInt(bucketHashStr, 10);
        break;
      }
    }
    return (item) => item.bucket.hash === bucketHash;
  },
  fromItem: (item) => `is:${d1BucketToType[item.bucket.hash as BucketHashes]}`,
} satisfies ItemFilterDefinition;

export const itemCategoryFilter = {
  keywords: [
    ...Object.keys(itemCategoryHashesByName),
    ...Object.keys(itemCategoryAliases),
    'grenadelauncher',
  ],
  description: tl('Filter.WeaponType'),
  filter: ({ filterValue }) => {
    // Before special GLs and heavy GLs were entirely separated, `is:grenadelauncher` matched both.
    // This keeps existing searches valid and unchanged in behavior.
    if (filterValue === 'grenadelauncher') {
      return (item) =>
        item.itemCategoryHashes.includes(ItemCategoryHashes.GrenadeLaunchers) ||
        item.itemCategoryHashes.includes(-ItemCategoryHashes.GrenadeLaunchers);
    }
    filterValue = filterValue.replace(/\s/g, '');
    const categoryHash = itemCategoryHashesByName[itemCategoryAliases[filterValue] ?? filterValue];
    if (!categoryHash) {
      throw new Error(`Unknown weapon type ${filterValue}`);
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
        ([_tag, ich]) => ich === itemCategoryHash,
      )?.[0];
      if (typeTag) {
        return `is:${typeTag}`;
      }
    }
    return '';
  },
} satisfies ItemFilterDefinition;

export const ammoTypeFilter = {
  keywords: ['special', 'primary', 'heavy'],
  description: tl('Filter.AmmoType'),
  destinyVersion: 2,
  filter: ({ filterValue }) => {
    const ammoType = d2AmmoTypes[filterValue as keyof typeof d2AmmoTypes];
    return (item: DimItem) => item.ammoType === ammoType;
  },
  fromItem: (item) => {
    const ammoType = Object.entries(d2AmmoTypes).find(
      ([_ammoType, value]) => value === item.ammoType,
    );
    return ammoType ? `is:${ammoType[0]}` : '';
  },
} satisfies ItemFilterDefinition;

const knownValuesFilters: ItemFilterDefinition[] = [
  damageFilter,
  prismaticDamageFilter,
  classFilter,
  itemCategoryFilter,
  itemTypeFilter,
  d1itemTypeFilter,
  ammoTypeFilter,
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
      const rarityName = rarityMap[filterValue];
      if (!rarityName) {
        throw new Error(`Unknown rarity type ${filterValue}`);
      }
      return (item) => item.rarity === rarityName;
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
    suggestions: [...Object.keys(breakerTypes), 'intrinsic'],
    destinyVersion: 2,
    filter: ({ filterValue }) => {
      if (filterValue === 'intrinsic') {
        return (item) => Boolean(item.breakerType);
      }
      const breakerType = breakerTypes[filterValue as keyof typeof breakerTypes];
      if (!breakerType) {
        throw new Error(`Unknown breaker type ${filterValue}`);
      }
      const breakingIchs = breakerType.flatMap((ty) => artifactBreakerMods[ty] || []);
      return (item) =>
        item.breakerType
          ? breakerType.includes(item.breakerType?.hash as BreakerTypeHashes)
          : item.itemCategoryHashes.some((ich) => breakingIchs.includes(ich));
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
    filter: () => patternIsUnlocked,
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
        return (item) =>
          (item.source && sourceInfo.sourceHashes?.includes(item.source)) ||
          sourceInfo.itemHashes?.includes(item.hash);
      } else if (D2EventPredicateLookup[filterValue]) {
        const predicate = D2EventPredicateLookup[filterValue];
        return (item: DimItem) => getEvent(item) === predicate;
      } else {
        throw new Error(`Unknown item source ${filterValue}`);
      }
    },
  },
  {
    keywords: 'focusable',
    description: tl('Filter.Focusable'),
    destinyVersion: 2,
    filter: () => {
      const outputValues = Object.values(focusingOutputs);
      return (item) => outputValues.includes(item.hash);
    },
  },
];

export function patternIsUnlocked(item: DimItem) {
  return (
    item.patternUnlockRecord &&
    !(item.patternUnlockRecord.state & DestinyRecordState.ObjectiveNotCompleted)
  );
}

export default knownValuesFilters;
