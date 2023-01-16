import { tl } from 'app/i18next-t';
import { D1Item, DimItem } from 'app/inventory/item-types';
import { getItemYear } from 'app/utils/item-utils';
import {
  boosts,
  D1ActivityHashes,
  sublimeEngrams,
  supplies,
  vendorHashes,
} from '../d1-known-values';
import { FilterDefinition } from '../filter-types';

// these just check an attribute found on DimItem
const d1Filters: FilterDefinition[] = [
  {
    keywords: 'sublime',
    description: tl('Filter.RarityTier'),
    destinyVersion: 1,
    filter: () => (item: DimItem) => sublimeEngrams.includes(item.hash),
  },
  {
    // Upgraded will show items that have enough XP to unlock all
    // their nodes and only need the nodes to be purchased.
    keywords: 'upgraded',
    description: [tl('Filter.Leveling.Upgraded'), { term: 'upgraded' }],
    destinyVersion: 1,
    filter: () => (item: DimItem) => (item as D1Item).talentGrid?.xpComplete && !item.complete,
  },
  {
    // Complete shows items that are fully leveled.
    keywords: 'complete',
    description: [tl('Filter.Leveling.Complete'), { term: 'complete' }],
    destinyVersion: 1,
    filter: () => (item: DimItem) => item.complete,
  },
  {
    // Incomplete will show items that are not fully leveled.
    keywords: 'incomplete',
    description: [tl('Filter.Leveling.Incomplete'), { term: 'incomplete' }],
    destinyVersion: 1,
    filter: () => (item: DimItem) => (item as D1Item).talentGrid && !item.complete,
  },
  {
    keywords: 'xpcomplete',
    description: [tl('Filter.Leveling.XPComplete'), { term: 'xpcomplete' }],
    destinyVersion: 1,
    filter: () => (item: DimItem) => (item as D1Item).talentGrid?.xpComplete,
  },
  {
    keywords: ['xpincomplete', 'needsxp'],
    description: [tl('Filter.Leveling.NeedsXP'), { term: 'xpincomplete/needsxp' }],
    destinyVersion: 1,
    filter: () => (item: DimItem) => (item as D1Item).talentGrid?.xpComplete,
  },

  {
    keywords: ['ascended'],
    description: tl('Filter.Ascended'),
    destinyVersion: 1,
    filter: () => (item: DimItem) => {
      const d1Item = item as D1Item;
      return d1Item.talentGrid?.hasAscendNode && d1Item.talentGrid.ascended;
    },
  },
  {
    keywords: ['unascended'],
    description: tl('Filter.Unascended'),
    destinyVersion: 1,
    filter: () => (item: DimItem) => {
      const d1Item = item as D1Item;
      return d1Item.talentGrid?.hasAscendNode && !d1Item.talentGrid.ascended;
    },
  },
  {
    keywords: ['tracked', 'untracked'],
    description: tl('Filter.Tracked'),
    destinyVersion: 1,
    filter:
      ({ filterValue }) =>
      (item: DimItem) =>
        item.trackable && (filterValue === 'tracked' ? item.tracked : !item.tracked),
  },
  {
    keywords: ['reforgeable', 'reforge', 'rerollable', 'reroll'],
    description: tl('Filter.Reforgeable'),
    destinyVersion: 1,
    filter: () => (item: DimItem) =>
      (item as D1Item).talentGrid?.nodes.some((n) => n.hash === 617082448),
  },
  {
    keywords: 'engram',
    description: tl('Filter.Engrams'),
    destinyVersion: 1,
    filter: () => (item: DimItem) => item.isEngram,
  },
  {
    keywords: ['intellect', 'discipline', 'strength'],
    description: tl('Filter.NamedStat'),
    destinyVersion: 1,
    filter:
      ({ filterValue }) =>
      (item: DimItem) =>
        item.stats?.some((s) =>
          Boolean(s.displayProperties.name.toLowerCase() === filterValue && s.value > 0)
        ),
  },
  {
    keywords: ['glimmeritem', 'glimmerboost', 'glimmersupply'],
    description: tl('Filter.Glimmer'),
    destinyVersion: 1,
    filter:
      ({ filterValue }) =>
      (item: DimItem) => {
        switch (filterValue) {
          case 'glimmerboost':
            return boosts.includes(item.hash);
          case 'glimmersupply':
            return supplies.includes(item.hash);
          case 'glimmeritem':
            return boosts.includes(item.hash) || supplies.includes(item.hash);
        }
        return false;
      },
  },
  {
    keywords: ['ornamentable', 'ornamentmissing', 'ornamentunlocked'],
    description: tl('Filter.Ornament'),
    destinyVersion: 1,
    filter:
      ({ filterValue }) =>
      (item: DimItem) => {
        const complete = (item as D1Item).talentGrid?.nodes.some((n) => n.ornament);
        const missing = (item as D1Item).talentGrid?.nodes.some((n) => !n.ornament);

        if (filterValue === 'ornamentunlocked') {
          return complete;
        } else if (filterValue === 'ornamentmissing') {
          return missing;
        } else {
          return complete || missing;
        }
      },
  },
  {
    keywords: ['quality', 'percentage'],
    description: [tl('Filter.Quality'), { percentage: 'percentage', quality: 'quality' }],
    format: 'range',
    destinyVersion: 1,
    filter:
      ({ compare }) =>
      (item: DimItem) => {
        const d1Item = item as D1Item;
        if (!d1Item.quality) {
          return false;
        }
        return compare!(d1Item.quality.min);
      },
  },
  {
    keywords: [
      'fwc',
      'do',
      'nm',
      'speaker',
      'variks',
      'shipwright',
      'vanguard',
      'osiris',
      'xur',
      'shaxx',
      'cq',
      'eris',
      'ev',
      'gunsmith',
    ],
    description: tl('Filter.Vendor'),
    destinyVersion: 1,
    filter:
      ({ filterValue }) =>
      (item: DimItem) => {
        const restricted = vendorHashes.restricted[filterValue];
        const required = vendorHashes.required[filterValue];
        const match = (vendorHash: number) => (item as D1Item).sourceHashes.includes(vendorHash);
        if (restricted) {
          return (!required || required.some(match)) && !restricted.some(match);
        } else {
          return required?.some(match);
        }
      },
  },
  {
    keywords: [
      'vanilla',
      'trials',
      'ib',
      'qw',
      'cd',
      'srl',
      'vog',
      'ce',
      'ttk',
      'kf',
      'roi',
      'wotm',
      'poe',
      'coe',
      'af',
      'dawning',
      'aot',
    ],
    description: tl('Filter.Release'),
    destinyVersion: 1,
    filter:
      ({ filterValue }) =>
      (item: DimItem) => {
        if (filterValue === 'vanilla') {
          return getItemYear(item) === 1;
        } else if (D1ActivityHashes.restricted[filterValue]) {
          return (
            D1ActivityHashes.required[filterValue].some((sourceHash: number) =>
              (item as D1Item).sourceHashes.includes(sourceHash)
            ) &&
            !D1ActivityHashes.restricted[filterValue].some((sourceHash: number) =>
              (item as D1Item).sourceHashes.includes(sourceHash)
            )
          );
        } else {
          return D1ActivityHashes.required[filterValue].some((sourceHash: number) =>
            (item as D1Item).sourceHashes.includes(sourceHash)
          );
        }
      },
  },
];

export default d1Filters;
