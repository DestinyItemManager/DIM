import { D1Item } from 'app/inventory/item-types';
import {
  boosts,
  D1ActivityHashes,
  sublimeEngrams,
  supplies,
  vendorHashes,
} from '../d1-known-values';
import { FilterDefinition } from '../filter-types';
import { rangeStringToComparator } from './range-numeric';

// these just check an attribute found on DimItem
const d1Filters: FilterDefinition[] = [
  {
    keywords: ['sublime'],
    description: ['Filter.RarityTier'],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item) => sublimeEngrams.includes(item.hash),
  },
  {
    // Upgraded will show items that have enough XP to unlock all
    // their nodes and only need the nodes to be purchased.
    keywords: ['upgraded'],
    description: ['Filter.Leveling.Upgraded', { term: 'upgraded' }],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item) => item.talentGrid?.xpComplete && !item.complete,
  },
  {
    // Complete shows items that are fully leveled.
    keywords: ['complete'],
    description: ['Filter.Leveling.Complete', { term: 'complete' }],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item) => item.complete,
  },
  {
    // Incomplete will show items that are not fully leveled.
    keywords: ['incomplete'],
    description: ['Filter.Leveling.Incomplete', { term: 'incomplete' }],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item) => item.talentGrid && !item.complete,
  },
  {
    keywords: ['xpcomplete'],
    description: ['Filter.Leveling.XPComplete', { term: 'xpcomplete' }],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item) => item.talentGrid?.xpComplete,
  },
  {
    keywords: ['xpincomplete', 'needsxp'],
    description: ['Filter.Leveling.NeedsXP', { term: 'xpincomplete/needsxp' }],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item) => item.talentGrid && !item.talentGrid.xpComplete,
  },

  {
    keywords: ['ascended', 'assended', 'asscended'],
    description: ['ascended'],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item) => item.talentGrid?.hasAscendNode && item.talentGrid.ascended,
  },
  {
    keywords: ['unascended', 'unassended', 'unasscended'],
    description: ['unascended'],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item) => item.talentGrid?.hasAscendNode && !item.talentGrid.ascended,
  },
  {
    keywords: ['tracked', 'untracked'],
    description: ['Filter.Tracked'],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item, filterValue: string) =>
      item.trackable && (filterValue === 'tracked' ? item.tracked : !item.tracked),
  },
  {
    keywords: ['reforgeable', 'reforge', 'rerollable', 'reroll'],
    description: ['Filter.Reforgeable'],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item) => item.talentGrid?.nodes.some((n) => n.hash === 617082448),
  },
  {
    keywords: ['engram'],
    description: ['Filter.Engrams'],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item) => item.isEngram,
  },
  {
    keywords: ['intellect', 'discipline', 'strength'],
    description: ['Filter.NamedStat'],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item, filterValue: string) =>
      item.stats?.some((s) =>
        Boolean(s.displayProperties.name.toLowerCase() === filterValue && s.value > 0)
      ),
  },
  {
    keywords: ['glimmeritem', 'glimmerboost', 'glimmersupply'],
    description: ['Filter.Glimmer.Glimmer'],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item, filterValue: string) => {
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
    description: ['Filter.Ornament'],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item, filterValue: string) => {
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
    description: ['Filter.Quality', { percentage: 'percentage', quality: 'quality' }],
    format: 'range',
    destinyVersion: 1,
    filterValuePreprocessor: rangeStringToComparator,
    filterFunction: (item: D1Item, filterValue: (compare: number) => boolean) => {
      if (!item.quality) {
        return false;
      }
      return filterValue(item.quality.min);
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
    description: ['Filter.Vendor'],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item, filterValue: string) => {
      if (vendorHashes.restricted[filterValue]) {
        return (
          vendorHashes.required[filterValue].some((vendorHash) =>
            item.sourceHashes.includes(vendorHash)
          ) &&
          !vendorHashes.restricted[filterValue].some((vendorHash) =>
            item.sourceHashes.includes(vendorHash)
          )
        );
      } else {
        return vendorHashes.required[filterValue].some((vendorHash) =>
          item.sourceHashes.includes(vendorHash)
        );
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
    description: ['Filter.Release'],
    format: 'simple',
    destinyVersion: 1,
    filterFunction: (item: D1Item, filterValue: string) => {
      if (filterValue === 'vanilla') {
        return item.year === 1;
      } else if (D1ActivityHashes.restricted[filterValue]) {
        return (
          D1ActivityHashes.required[filterValue].some((sourceHash: number) =>
            item.sourceHashes.includes(sourceHash)
          ) &&
          !D1ActivityHashes.restricted[filterValue].some((sourceHash: number) =>
            item.sourceHashes.includes(sourceHash)
          )
        );
      } else {
        return D1ActivityHashes.required[filterValue].some((sourceHash: number) =>
          item.sourceHashes.includes(sourceHash)
        );
      }
    },
  },
];

export default d1Filters;
