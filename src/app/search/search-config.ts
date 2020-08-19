import { itemTagSelectorList } from '../inventory/dim-item-info';
import { modSlotTags } from 'app/utils/item-utils';

import { D1Categories } from '../destiny1/d1-bucket-categories';
import { D2Categories } from '../destiny2/d2-bucket-categories';
import { D2EventPredicateLookup } from 'data/d2/d2-event-info';
import D2Sources from 'data/d2/source-info';
import _ from 'lodash';
import seasonTags from 'data/d2/season-tags.json';
import { DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { D1ItemCategoryHashes } from './d1-known-values';
import {
  breakerTypes,
  D2ItemCategoryHashesByName,
  energyCapacityTypeNames,
} from './d2-known-values';
import { damageTypeNames, searchableStatNames } from './search-filter-values';
import { createSelector } from 'reselect';
import { destinyVersionSelector } from 'app/accounts/selectors';

export const searchConfigSelector = createSelector(destinyVersionSelector, buildSearchConfig);

//
// SearchConfig
//

export interface SearchConfig {
  destinyVersion: DestinyVersion;
  keywords: string[];
  categoryHashFilters: { [key: string]: number };
  keywordToFilter: { [key: string]: string };
}

const operators = ['<', '>', '<=', '>=', '='];

/** Builds an object that describes the available search keywords and category mappings. */
export function buildSearchConfig(destinyVersion: DestinyVersion): SearchConfig {
  const isD1 = destinyVersion === 1;
  const isD2 = destinyVersion === 2;
  const categories = isD1 ? D1Categories : D2Categories;
  const itemTypes = Object.values(categories).flatMap((l: string[]) =>
    l.map((v) => v.toLowerCase())
  );

  // Add new ItemCategoryHash hashes to this, to add new category searches
  const categoryHashFilters: { [key: string]: number } = {
    ...D1ItemCategoryHashes,
    ...(isD2 ? D2ItemCategoryHashesByName : {}),
  };

  const stats = [
    'charge',
    'impact',
    'range',
    'stability',
    'reload',
    'magazine',
    'aimassist',
    'equipspeed',
    'handling',
    'blastradius',
    'recoildirection',
    'velocity',
    'zoom',
    'discipline',
    'intellect',
    'strength',
    ...(isD1 ? ['rof'] : []),
    ...(isD2
      ? [
          'rpm',
          'mobility',
          'recovery',
          'resilience',
          'drawtime',
          'inventorysize',
          'total',
          'custom',
          'any',
        ]
      : []),
  ];

  /**
   * sets of single key -> multiple values
   *
   * keys: the filter to run
   *
   * values: the strings that trigger this filter, and the value to feed into that filter
   *
   */
  // i.e. { dmg: ['arc', 'solar', 'void'] }
  // so search string 'arc' runs dmg('arc'), search string 'solar' runs dmg('solar') etc
  const singleTermFilters: {
    [key: string]: string[];
  } = {
    dmg: damageTypeNames,
    type: itemTypes,
    tier: [
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
    classType: ['titan', 'hunter', 'warlock'],
    dupe: ['dupe', 'duplicate'],
    seasonaldupe: ['seasonaldupe', 'seasonalduplicate'],
    dupelower: ['dupelower'],
    locked: ['locked'],
    unlocked: ['unlocked'],
    stackable: ['stackable'],
    weapon: ['weapon'],
    armor: ['armor'],
    categoryHash: Object.keys(categoryHashFilters),
    inloadout: ['inloadout'],
    maxpower: ['maxpower'],
    new: ['new'],
    tagged: ['tagged'],
    level: ['level'],
    equipment: ['equipment', 'equippable'],
    postmaster: ['postmaster', 'inpostmaster'],
    equipped: ['equipped'],
    transferable: ['transferable', 'movable'],
    infusable: ['infusable', 'infuse'],
    owner: ['invault', 'incurrentchar'],
    location: ['inleftchar', 'inmiddlechar', 'inrightchar'],
    onwrongclass: ['onwrongclass'],
    hasnotes: ['hasnotes'],
    cosmetic: ['cosmetic'],
    tracked: ['tracked'],
    untracked: ['untracked'],
    ...(isD1
      ? {
          hasLight: ['light', 'haslight'],
          sublime: ['sublime'],
          incomplete: ['incomplete'],
          complete: ['complete'],
          xpcomplete: ['xpcomplete'],
          xpincomplete: ['xpincomplete', 'needsxp'],
          upgraded: ['upgraded'],
          unascended: ['unascended', 'unassended', 'unasscended'],
          ascended: ['ascended', 'assended', 'asscended'],
          reforgeable: ['reforgeable', 'reforge', 'rerollable', 'reroll'],
          ornament: ['ornamentable', 'ornamentmissing', 'ornamentunlocked'],
          engram: ['engram'],
          stattype: ['intellect', 'discipline', 'strength'],
          glimmer: ['glimmeritem', 'glimmerboost', 'glimmersupply'],
          vendor: [
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
          activity: [
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
        }
      : {}),
    ...(isD2
      ? {
          ammoType: ['special', 'primary', 'heavy'],
          hascapacity: ['hascapacity', 'armor2.0'],
          complete: ['goldborder', 'yellowborder', 'complete'],
          curated: ['curated'],
          hasLight: ['light', 'haslight', 'haspower'],
          hasMod: ['hasmod'],
          modded: ['modded'],
          hasShader: ['shaded', 'hasshader'],
          hasOrnament: ['ornamented', 'hasornament'],
          masterworked: ['masterwork', 'masterworks'],
          powerfulreward: ['powerfulreward'],
          randomroll: ['randomroll'],
          trashlist: ['trashlist'],
          wishlist: ['wishlist'],
          wishlistdupe: ['wishlistdupe'],
        }
      : {}),
    ...($featureFlags.reviewsEnabled ? { hasRating: ['rated', 'hasrating'] } : {}),
  };

  // Filters that operate on numeric ranges with comparison operators
  const ranges = [
    'light',
    'power',
    'stack',
    'count',
    'year',
    ...(isD1 ? ['level', 'quality', 'percentage'] : []),
    ...(isD2 ? ['masterwork', 'season', 'powerlimit', 'sunsetsafter', 'powerlimitseason'] : []),
    ...($featureFlags.reviewsEnabled ? ['rating', 'ratingcount'] : []),
  ];

  // build search suggestions for single-term filters, or freeform text, or the above ranges
  const keywords: string[] = [
    // an "is:" and a "not:" for every filter and its synonyms
    ...Object.values(singleTermFilters)
      .flat()
      .flatMap((word) => [`is:${word}`, `not:${word}`]),
    ...itemTagSelectorList.map((tag) => (tag.type ? `tag:${tag.type}` : 'tag:none')),
    // a keyword for every combination of an item stat name and mathmatical operator
    ...stats.flatMap((stat) => operators.map((comparison) => `stat:${stat}:${comparison}`)),
    // additional basestat searches for armor stats
    ...searchableStatNames.flatMap((stat) =>
      operators.map((comparison) => `basestat:${stat}:${comparison}`)
    ),
    // keywords for checking which stat is masterworked
    ...(isD2 ? stats.map((stat) => `masterwork:${stat}`) : []),
    // keywords for named seasons. reverse so newest seasons are first
    ...(isD2
      ? Object.keys(seasonTags)
          .reverse()
          .map((tag) => `season:${tag}`)
      : []),
    // keywords for seasonal mod slots
    ...(isD2
      ? modSlotTags.concat(['any', 'none']).map((modSlotName) => `modslot:${modSlotName}`)
      : []),
    ...(isD2
      ? modSlotTags.concat(['any', 'none']).map((modSlotName) => `holdsmod:${modSlotName}`)
      : []),
    // a keyword for every combination of a DIM-processed stat and mathmatical operator
    ...ranges.flatMap((range) => operators.map((comparison) => `${range}:${comparison}`)),
    // energy capacity elements and ranges
    ...(isD2 ? energyCapacityTypeNames.map((element) => `energycapacity:${element}`) : []),
    ...(isD2 ? operators.map((comparison) => `energycapacity:${comparison}`) : []),
    // keywords for checking when an item hits power limit. s11 is the first valid season for this
    ...(isD2
      ? Object.entries(seasonTags)
          .filter(([, seasonNumber]) => seasonNumber > 10)
          .reverse()
          .map(([tag]) => `sunsetsafter:${tag}`)
      : []),
    ...(isD2 ? Object.keys(breakerTypes).map((breakerType) => `breaker:${breakerType}`) : []),
    // "source:" keyword plus one for each source
    ...(isD2
      ? [
          'source:',
          'wishlistnotes:',
          ...Object.keys(D2Sources).map((word) => `source:${word}`),
          ...Object.keys(D2EventPredicateLookup).map((word) => `source:${word}`),
          // maximum stat finders
          ...searchableStatNames.map((armorStat) => `maxbasestatvalue:${armorStat}`),
          ...searchableStatNames.map((armorStat) => `maxstatvalue:${armorStat}`),
          ...searchableStatNames.map((armorStat) => `maxstatloadout:${armorStat}`),
        ]
      : []),
    // all the free text searches that support quotes
    ...['notes:', 'perk:', 'perkname:', 'name:', 'description:'],
  ];

  // create suggestion stubs for filter names
  const keywordStubs = keywords.flatMap((keyword) => {
    const keywordSegments = keyword //   'basestat:mobility:<='
      .split(':') //                   [ 'basestat' , 'mobility' , '<=']
      .slice(0, -1); //                [ 'basestat' , 'mobility' ]
    const stubs: string[] = [];
    for (let i = 1; i <= keywordSegments.length; i++) {
      stubs.push(keywordSegments.slice(0, i).join(':') + ':');
    }
    return stubs; //                   [ 'basestat:' , 'basestat:mobility:' ]
  });
  keywords.push(...new Set(keywordStubs));

  // Build an inverse mapping of keyword to function name
  const keywordToFilter: { [key: string]: string } = {};
  _.forIn(singleTermFilters, (keywords, functionName) => {
    for (const keyword of keywords) {
      keywordToFilter[keyword] = functionName;
    }
  });

  return {
    keywordToFilter,
    keywords: [...new Set(keywords)], // de-dupe kinetic (dmg) & kinetic (slot)
    destinyVersion,
    categoryHashFilters,
  };
}
