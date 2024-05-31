import { tl } from 'app/i18next-t';
import { D1Item } from 'app/inventory/item-types';
import {
  boosts,
  D1ActivityHashes,
  sublimeEngrams,
  supplies,
  vendorHashes,
} from 'app/search/d1-known-values';
import { FilterDefinition } from 'app/search/filter-types';
import { getItemYear } from 'app/utils/item-utils';
import { FilterContext, ItemFilterDefinition, SuggestionsContext } from '../item-filter-types';

/**
 * A filter that's only valid for Destiny 1 and gets to operate on D1Items instead,
 * to enable a safe cast to FilterDefinition.
 */
type D1FilterDefinition = FilterDefinition<D1Item, FilterContext, SuggestionsContext> & {
  destinyVersion: 1;
};

// these just check an attribute found on DimItem
const d1Filters: D1FilterDefinition[] = [
  {
    keywords: 'sublime',
    description: tl('Filter.RarityTier'),
    destinyVersion: 1,
    filter: () => (item) => sublimeEngrams.includes(item.hash),
  },
  {
    // Upgraded will show items that have enough XP to unlock all
    // their nodes and only need the nodes to be purchased.
    keywords: 'upgraded',
    description: [tl('Filter.Leveling.Upgraded'), { term: 'upgraded' }],
    destinyVersion: 1,
    filter: () => (item) => item.talentGrid?.xpComplete && !item.complete,
  },
  {
    // Complete shows items that are fully leveled.
    keywords: 'complete',
    description: [tl('Filter.Leveling.Complete'), { term: 'complete' }],
    destinyVersion: 1,
    filter: () => (item) => item.complete,
  },
  {
    // Incomplete will show items that are not fully leveled.
    keywords: 'incomplete',
    description: [tl('Filter.Leveling.Incomplete'), { term: 'incomplete' }],
    destinyVersion: 1,
    filter: () => (item) => item.talentGrid && !item.complete,
  },
  {
    keywords: 'xpcomplete',
    description: [tl('Filter.Leveling.XPComplete'), { term: 'xpcomplete' }],
    destinyVersion: 1,
    filter: () => (item) => item.talentGrid?.xpComplete,
  },
  {
    keywords: ['xpincomplete', 'needsxp'],
    description: [tl('Filter.Leveling.NeedsXP'), { term: 'xpincomplete/needsxp' }],
    destinyVersion: 1,
    filter: () => (item) => item.talentGrid?.xpComplete,
  },

  {
    keywords: ['ascended'],
    description: tl('Filter.Ascended'),
    destinyVersion: 1,
    filter: () => (item) => item.talentGrid?.hasAscendNode && item.talentGrid.ascended,
  },
  {
    keywords: ['unascended'],
    description: tl('Filter.Unascended'),
    destinyVersion: 1,
    filter: () => (item) => item.talentGrid?.hasAscendNode && !item.talentGrid.ascended,
  },
  {
    keywords: ['tracked', 'untracked'],
    description: tl('Filter.Tracked'),
    destinyVersion: 1,
    filter:
      ({ filterValue }) =>
      (item) =>
        item.trackable && (filterValue === 'tracked' ? item.tracked : !item.tracked),
  },
  {
    keywords: ['reforgeable', 'reforge', 'rerollable', 'reroll'],
    description: tl('Filter.Reforgeable'),
    destinyVersion: 1,
    filter: () => (item) => item.talentGrid?.nodes.some((n) => n.hash === 617082448),
  },
  {
    keywords: 'engram',
    description: tl('Filter.Engrams'),
    destinyVersion: 1,
    filter: () => (item) => item.isEngram,
  },
  {
    keywords: ['intellect', 'discipline', 'strength'],
    description: tl('Filter.NamedStat'),
    destinyVersion: 1,
    filter:
      ({ filterValue }) =>
      (item) =>
        item.stats?.some((s) =>
          Boolean(s.displayProperties.name.toLowerCase() === filterValue && s.value > 0),
        ),
  },
  {
    keywords: ['glimmeritem', 'glimmerboost', 'glimmersupply'],
    description: tl('Filter.Glimmer'),
    destinyVersion: 1,
    filter:
      ({ filterValue }) =>
      (item) => {
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
      (item) => {
        const complete = item.talentGrid?.nodes.some((n) => n.ornament);
        const missing = item.talentGrid?.nodes.some((n) => !n.ornament);

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
      (item) => {
        if (!item.quality) {
          return false;
        }
        return compare!(item.quality.min);
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
      (item) => {
        const restricted = vendorHashes.restricted[filterValue];
        const required = vendorHashes.required[filterValue];
        const match = (vendorHash: number) => item.sourceHashes.includes(vendorHash);
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
      (item) => {
        if (filterValue === 'vanilla') {
          return getItemYear(item) === 1;
        } else if (D1ActivityHashes.restricted[filterValue]) {
          return (
            D1ActivityHashes.required[filterValue]?.some((sourceHash: number) =>
              item.sourceHashes.includes(sourceHash),
            ) &&
            !D1ActivityHashes.restricted[filterValue]?.some((sourceHash: number) =>
              item.sourceHashes.includes(sourceHash),
            )
          );
        } else {
          return D1ActivityHashes.required[filterValue]?.some((sourceHash: number) =>
            item.sourceHashes.includes(sourceHash),
          );
        }
      },
  },
];

export default d1Filters as ItemFilterDefinition[];
