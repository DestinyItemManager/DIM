import * as _ from 'underscore';
import { flatMap } from '../util';
import { compareBy, chainComparator, reverseComparator } from '../comparators';
import { TagInfo } from '../settings/settings';
import { DimItem, DimD1Item } from '../inventory/store/d2-item-factory.service';
import { StoreServiceType } from '../inventory/d2-stores.service';

interface SearchConfig {
  keywords: string[];
  categoryFilters: { [key: string]: string[] };
  keywordToFilter: { [key: string]: string };
}

/**
 * Builds an object that describes the available search keywords and category mappings.
 */
export function buildSearchConfig(
  destinyVersion: 1 | 2,
  itemTags: TagInfo[],
  categories: {
    [category: string]: string[];
  }
): SearchConfig {
  const categoryFilters = {
    pulserifle: ['CATEGORY_PULSE_RIFLE'],
    scoutrifle: ['CATEGORY_SCOUT_RIFLE'],
    handcannon: ['CATEGORY_HAND_CANNON'],
    autorifle: ['CATEGORY_AUTO_RIFLE'],
    sniperrifle: ['CATEGORY_SNIPER_RIFLE'],
    shotgun: ['CATEGORY_SHOTGUN'],
    sidearm: ['CATEGORY_SIDEARM'],
    rocketlauncher: ['CATEGORY_ROCKET_LAUNCHER'],
    fusionrifle: ['CATEGORY_FUSION_RIFLE'],
    sword: ['CATEGORY_SWORD'],
  };

  const itemTypes: string[] = [];

  const stats = ['charge', 'impact', 'range', 'stability', 'reload', 'magazine', 'aimassist', 'equipspeed'];

  if (destinyVersion === 1) {
    Object.assign(categoryFilters, {
      primaryweaponengram: ['CATEGORY_PRIMARY_WEAPON', 'CATEGORY_ENGRAM'],
      specialweaponengram: ['CATEGORY_SPECIAL_WEAPON', 'CATEGORY_ENGRAM'],
      heavyweaponengram: ['CATEGORY_HEAVY_WEAPON', 'CATEGORY_ENGRAM'],
      machinegun: ['CATEGORY_MACHINE_GUN'],
    });
    itemTypes.push(...flatMap(Object.values(categories), (l: string[]) => l.map((v) => v.toLowerCase())));
    stats.push('rof');
  } else {
    Object.assign(categoryFilters, {
      grenadelauncher: ['CATEGORY_GRENADE_LAUNCHER'],
      submachine: ['CATEGORY_SUBMACHINEGUN'],
    });
    itemTypes.push(...flatMap(Object.values(categories), (l: string[]) => l.map((v) => v.toLowerCase())));
    stats.push('rpm');
  }

  /**
   * Filter translation sets. Left-hand is the filter to run from filterFns, right side are possible filterResult
   * values that will set the left-hand to the "match."
   */
  const filterTrans: {
    [key: string]: string[];
  } = {
    dmg: ['arc', 'solar', 'void', 'kinetic'],
    type: itemTypes,
    tier: ['common', 'uncommon', 'rare', 'legendary', 'exotic', 'white', 'green', 'blue', 'purple', 'yellow'],
    classType: ['titan', 'hunter', 'warlock'],
    dupe: ['dupe', 'duplicate', 'dupelower'],
    locked: ['locked'],
    unlocked: ['unlocked'],
    stackable: ['stackable'],
    category: Object.keys(categoryFilters),
    inloadout: ['inloadout'],
    new: ['new'],
    tag: ['tagged'],
    level: ['level'],
    weapon: ['weapon'],
    armor: ['armor'],
    equipment: ['equipment', 'equippable'],
    postmaster: ['postmaster', 'inpostmaster'],
    equipped: ['equipped'],
    transferable: ['transferable', 'movable'],
    infusable: ['infusable', 'infuse']
  };

  if (destinyVersion === 1) {
    Object.assign(filterTrans, {
      hasLight: ['light', 'haslight'],
      tracked: ['tracked'],
      untracked: ['untracked'],
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
      year: ['year1', 'year2', 'year3'],
      vendor: ['fwc', 'do', 'nm', 'speaker', 'variks', 'shipwright', 'vanguard', 'osiris', 'xur', 'shaxx', 'cq', 'eris', 'ev', 'gunsmith'],
      activity: ['vanilla', 'trials', 'ib', 'qw', 'cd', 'srl', 'vog', 'ce', 'ttk', 'kf', 'roi', 'wotm', 'poe', 'coe', 'af', 'dawning', 'aot'],
      cosmetic: ['cosmetic']
    });
  } else {
    Object.assign(filterTrans, {
      hasLight: ['light', 'haslight', 'haspower'],
      powermod: ['powermod', 'haspowermod'],
      complete: ['goldborder', 'yellowborder', 'complete'],
      masterwork: ['masterwork', 'masterworks']
    });
  }

  if ($featureFlags.reviewsEnabled) {
    filterTrans.hasRating = ['rated', 'hasrating'];
  }

  const keywords: string[] = _.flatten(_.flatten(Object.values(filterTrans)).map((word) => {
    return [`is:${word}`, `not:${word}`];
  }));

  itemTags.forEach((tag) => {
    if (tag.type) {
      keywords.push(`tag:${tag.type}`);
    } else {
      keywords.push("tag:none");
    }
  });

  // Filters that operate on ranges (>, <, >=, <=)
  const comparisons = [":<", ":>", ":<=", ":>=", ":"];

  stats.forEach((word) => {
    const filter = `stat:${word}`;
    comparisons.forEach((comparison) => {
      keywords.push(filter + comparison);
    });
  });

  const ranges = ['light', 'power', 'level', 'stack'];
  if (destinyVersion === 1) {
    ranges.push('quality', 'percentage');
  } else {
    ranges.push('basepower');
  }

  if ($featureFlags.reviewsEnabled) {
    ranges.push('rating');
    ranges.push('ratingcount');
  }

  ranges.forEach((range) => {
    comparisons.forEach((comparison) => {
      keywords.push(range + comparison);
    });
  });

  // free form notes on items
  keywords.push('notes:');

  // Build an inverse mapping of keyword to function name
  const keywordToFilter: { [key: string]: string } = {};
  _.each(filterTrans, (keywords, functionName) => {
    for (const keyword of keywords) {
      keywordToFilter[keyword] = functionName;
    }
  });

  return {
    keywordToFilter,
    keywords,
    categoryFilters
  };
}

// The comparator for sorting dupes - the first item will be the "best" and all others are "dupelower".
const dupeComparator = reverseComparator(chainComparator(
  // basePower
  compareBy((item: DimItem) => item.basePower || (item.primStat && item.primStat.value)),
  // primary stat
  compareBy((item: DimItem) => item.primStat && item.primStat.value),
  compareBy((item: DimItem) => item.masterwork),
  // has a power mod
  compareBy((item: DimItem) => item.primStat && item.basePower && (item.primStat.value !== item.basePower)),
  compareBy((item: DimItem) => item.locked),
  compareBy((item: DimItem) => item.dimInfo && item.dimInfo.tag && ['favorite', 'keep'].includes(item.dimInfo.tag)),
  compareBy((i: DimItem) => i.id) // tiebreak by ID
));

/**
 * This builds an object that can be used to generate filter functions from search queried.
 *
 */
export function searchFilters(
  searchConfig: SearchConfig,
  storeService: StoreServiceType,
  toaster,
  $i18next
): {
  filters: { [predicate: string]: (item: DimItem, predicate?: string) => boolean | "" | null | undefined | false | number };
  filterFunction(query: string): (item: DimItem) => boolean;
  reset();
} {
  let _duplicates: { [hash: number]: DimItem[] } | null = null; // Holds a map from item hash to count of occurrances of that hash
  let _lowerDupes = {};
  let _dupeInPost = false;

  // This refactored method filters items by stats
  //   * statType = [aa|impact|range|stability|rof|reload|magazine|equipspeed]
  const filterByStats = (statType) => {
    const statHash = {
      rpm: 4284893193,
      charge: 2961396640,
      impact: 4043523819,
      range: 1240592695,
      stability: 155624089,
      rof: 4284893193,
      reload: 4188031367,
      magazine: 387123106,
      aimassist: 1345609583,
      equipspeed: 943549884
    }[statType];

    return (item: DimItem, predicate: string) => {
      const foundStatHash = item.stats && item.stats.find((s) => s.statHash === statHash);
      return foundStatHash && foundStatHash.value && compareByOperand(foundStatHash.value, predicate);
    };
  };

  function compareByOperand(compare = 0, predicate) {
    if (predicate.length === 0) {
      return false;
    }

    const operands = ['<=', '>=', '=', '>', '<'];
    let operand = 'none';

    operands.forEach((element) => {
      if (predicate.substring(0, element.length) === element) {
        operand = element;
        predicate = predicate.substring(element.length);
        return false;
      } else {
        return true;
      }
    }, this);

    predicate = parseFloat(predicate);

    switch (operand) {
    case 'none':
      return compare === predicate;
    case '=':
      return compare === predicate;
    case '<':
      return compare < predicate;
    case '<=':
      return compare <= predicate;
    case '>':
      return compare > predicate;
    case '>=':
      return compare >= predicate;
    }
    return false;
  }

  // reset, filterFunction, and filters
  return {
    /**
     * Reset cached state in this filter object.
     */
    reset() {
      _duplicates = null;
      _lowerDupes = {};
      _dupeInPost = false;
    },

    /**
     * Build a complex predicate function from a full query string.
     */
    filterFunction(query: string): (item: DimItem) => boolean {
      // could probably tidy this regex, just a quick hack to support multi term:
      // [^\s]*"[^"]*" -> match is:"stuff here"
      // [^\s]*'[^']*' -> match is:'stuff here'
      // [^\s"']+' -> match is:stuff
      const searchTerms = query.match(/[^\s]*"[^"]*"|[^\s]*'[^']*'|[^\s"']+/g) || [];
      const filters: {
        invert: boolean;
        value: string;
        predicate: string;
      }[] = [];

      function addPredicate(predicate: string, filter: string, invert = false) {
        filters.push({ predicate, value: filter, invert });
      }

      // TODO: replace this if-ladder with a split and check
      for (let term of searchTerms) {
        term = term.replace(/['"]/g, '');

        if (term.startsWith('is:')) {
          const filter = term.replace('is:', '');
          const predicate = searchConfig.keywordToFilter[filter];
          if (predicate) {
            addPredicate(predicate, filter);
          }
        } else if (term.startsWith('not:')) {
          const filter = term.replace('not:', '');
          const predicate = searchConfig.keywordToFilter[filter];
          if (predicate) {
            addPredicate(predicate, filter, true);
          }
        } else if (term.startsWith('tag:')) {
          const filter = term.replace('tag:', '');
          addPredicate("itemtags", filter);
        } else if (term.startsWith('notes:')) {
          const filter = term.replace('notes:', '');
          addPredicate("notes", filter);
        } else if (term.startsWith('light:') || term.startsWith('power:')) {
          const filter = term.replace('light:', '').replace('power:', '');
          addPredicate("light", filter);
        } else if (term.startsWith('basepower:')) {
          const filter = term.replace('basepower:', '');
          addPredicate("basepower", filter);
        } else if (term.startsWith('stack:')) {
          const filter = term.replace('stack:', '');
          addPredicate("stack", filter);
        } else if (term.startsWith('level:')) {
          const filter = term.replace('level:', '');
          addPredicate("level", filter);
        } else if (term.startsWith('quality:') || term.startsWith('percentage:')) {
          const filter = term.replace('quality:', '').replace('percentage:', '');
          addPredicate("quality", filter);
        } else if (term.startsWith('rating:')) {
          const filter = term.replace('rating:', '');
          addPredicate("rating", filter);
        } else if (term.startsWith('ratingcount:')) {
          const filter = term.replace('ratingcount:', '');
          addPredicate("ratingcount", filter);
        } else if (term.startsWith('stat:')) {
          // Avoid console.error by checking if all parameters are typed
          const pieces = term.split(':');
          if (pieces.length === 3) {
            const filter = pieces[1];
            addPredicate(filter, pieces[2]);
          }
        } else if (!/^\s*$/.test(term)) {
          // TODO: not
          addPredicate("keyword", term);
        }
      }

      return (item) => {
        return filters.every((filter) => {
          const result = this.filters[filter.predicate](item, filter.value);
          return filter.invert ? !result : result;
        });
      };
    },

    /**
     * Each entry in this map is a filter function that will be provided the normalized
     * query term and an item, and should return whether or not it matches the filter.
     * @param predicate The predicate - for example, is:arc gets the 'elemental' filter function, with predicate='arc'
     * @param item The item to test against.
     * @return Returns true for a match, false for a non-match
     */
    filters: {
      dmg(item: DimItem, predicate: string) {
        return item.dmg === predicate;
      },
      type(item: DimItem, predicate: string) {
        return item.type && item.type.toLowerCase() === predicate;
      },
      tier(item: DimItem, predicate: string) {
        const tierMap = {
          white: 'common',
          green: 'uncommon',
          blue: 'rare',
          purple: 'legendary',
          yellow: 'exotic'
        };
        return item.tier.toLowerCase() === (tierMap[predicate] || predicate);
      },
      sublime(item: DimItem) {
        const sublimeEngrams = [
          1986458096, // -gauntlet
          2218811091,
          2672986950, // -body-armor
          779347563,
          3497374572, // -class-item
          808079385,
          3592189221, // -leg-armor
          738642122,
          3797169075, // -helmet
          838904328
        ];
        return sublimeEngrams.includes(item.hash);
      },
      // Incomplete will show items that are not fully leveled.
      incomplete(item: DimItem) {
        return item.talentGrid && !item.complete;
      },
      // Complete shows items that are fully leveled.
      complete(item: DimItem) {
        return item.complete;
      },
      // Upgraded will show items that have enough XP to unlock all
      // their nodes and only need the nodes to be purchased.
      upgraded(item: DimD1Item) {
        return item.talentGrid &&
          item.talentGrid.xpComplete &&
          !item.complete;
      },
      xpincomplete(item: DimD1Item) {
        return item.talentGrid &&
          !item.talentGrid.xpComplete;
      },
      xpcomplete(item: DimD1Item) {
        return item.talentGrid &&
          item.talentGrid.xpComplete;
      },
      ascended(item: DimD1Item) {
        return item.talentGrid &&
          item.talentGrid.hasAscendNode &&
          item.talentGrid.ascended;
      },
      unascended(item: DimD1Item) {
        return item.talentGrid &&
          item.talentGrid.hasAscendNode &&
          !item.talentGrid.ascended;
      },
      reforgeable(item: DimItem) {
        return item.talentGrid && _.any(item.talentGrid.nodes, { hash: 617082448 });
      },
      ornament(item: DimD1Item, predicate: string) {
        const complete = item.talentGrid && item.talentGrid.nodes.some((n) => n.ornament);
        const missing = item.talentGrid && item.talentGrid.nodes.some((n) => !n.ornament);

        if (predicate === 'ornamentunlocked') {
          return complete;
        } else if (predicate === 'ornamentmissing') {
          return missing;
        } else {
          return complete || missing;
        }
      },
      untracked(item: DimD1Item) {
        return item.trackable &&
          !item.tracked;
      },
      tracked(item: DimD1Item) {
        return item.trackable &&
          item.tracked;
      },
      unlocked(item: DimItem) {
        return (item.lockable &&
          !item.locked) || !item.lockable;
      },
      locked(item: DimItem) {
        return item.lockable &&
          item.locked;
      },
      masterwork(item: DimItem) {
        return item.masterwork;
      },
      dupe(item: DimItem, predicate: string) {
        if (_duplicates === null) {
          _duplicates = _.groupBy(storeService.getAllItems(), (i) => i.hash);
          _.each(_duplicates, (dupes: DimItem[]) => {
            if (dupes.length > 1) {
              dupes.sort(dupeComparator);
              const bestDupe = dupes[0];
              for (const dupe of dupes) {
                _lowerDupes[dupe.id] = dupe !== bestDupe;
              }

              if (!_dupeInPost) {
                if (dupes.some((dupe) => Boolean(dupe.location.inPostmaster))) {
                  toaster.pop('warning', $i18next.t('Filter.DupeInPostmaster'));
                  _dupeInPost = true;
                }
              }
            }
          });
        }

        if (predicate === 'dupelower') {
          return _lowerDupes[item.id];
        }

        // We filter out the "Default Shader" because everybody has one per character
        return item.hash !== 4248210736 && _duplicates[item.hash] && _duplicates[item.hash].length > 1;
      },
      classType(item: DimItem, predicate: string) {
        let value;

        switch (predicate) {
        case 'titan':
          value = 0;
          break;
        case 'hunter':
          value = 1;
          break;
        case 'warlock':
          value = 2;
          break;
        }

        return (item.classType === value);
      },
      glimmer(item: DimItem, predicate: string) {
        const boosts = [
          1043138475, // -black-wax-idol
          1772853454, // -blue-polyphage
          3783295803, // -ether-seeds
          3446457162 // -resupply-codes
        ];
        const supplies = [
          269776572, // -house-banners
          3632619276, // -silken-codex
          2904517731, // -axiomatic-beads
          1932910919 // -network-keys
        ];

        switch (predicate) {
        case 'glimmerboost':
          return boosts.includes(item.hash);
        case 'glimmersupply':
          return supplies.includes(item.hash);
        case 'glimmeritem':
          return boosts.includes(item.hash) || supplies.includes(item.hash);
        }
        return false;
      },
      itemtags(item: DimItem, predicate: string) {
        return item.dimInfo && (item.dimInfo.tag === predicate || (item.dimInfo.tag === undefined && predicate === 'none'));
      },
      notes(item: DimItem, predicate: string) {
        return item.dimInfo && item.dimInfo.notes && item.dimInfo.notes.toLocaleLowerCase().includes(predicate.toLocaleLowerCase());
      },
      stattype(item: DimItem, predicate: string) {
        return item.stats && _.any(item.stats, (s) => s.name.toLowerCase() === predicate && s.value > 0);
      },
      stackable(item: DimItem) {
        return item.maxStackSize > 1;
      },
      stack(item: DimItem, predicate: string) {
        return compareByOperand(item.amount, predicate);
      },
      engram(item: DimItem) {
        return item.isEngram();
      },
      infusable(item: DimItem) {
        return item.infusable;
      },
      category(item: DimItem, predicate: string) {
        const categories = searchConfig.categoryFilters[predicate.toLowerCase().replace(/\s/g, '')];

        if (!categories || !categories.length) {
          return false;
        }
        return categories.every((c) => item.inCategory(c));
      },
      keyword(item: DimItem, predicate: string) {
        return item.name.toLowerCase().includes(predicate) ||
          // Search for typeName (itemTypeDisplayName of modifications)
          item.typeName.toLowerCase().includes(predicate) ||
          // Search perks as well
          (item.talentGrid && item.talentGrid.nodes.some((node) => {
            // Fixed #798 by searching on the description too.
            return node.name.toLowerCase().includes(predicate) ||
              node.description.toLowerCase().includes(predicate);
          })) ||
          (item.sockets && item.sockets.sockets.some((socket) => {
            return Boolean(socket.plug &&
              (socket.plug.plugItem.displayProperties.name.toLowerCase().includes(predicate) ||
               socket.plug.plugItem.displayProperties.description.toLowerCase().includes(predicate)));
          }));
      },
      light(item: DimItem, predicate: string) {
        if (!item.primStat) {
          return false;
        }
        return compareByOperand(item.primStat.value, predicate);
      },
      basepower(item: DimItem, predicate: string) {
        if (!item.basePower) {
          return false;
        }
        return compareByOperand(item.basePower, predicate);
      },
      level(item: DimItem, predicate: string) {
        return compareByOperand(item.equipRequiredLevel, predicate);
      },
      quality(item: DimD1Item, predicate: string) {
        if (!item.quality) {
          return false;
        }
        return compareByOperand(item.quality.min, predicate);
      },
      hasRating(item: DimItem, predicate: string) {
        return predicate.length !== 0 && item.dtrRating;
      },
      rating(item: DimItem, predicate: string) {
        return item.dtrRating && compareByOperand(item.dtrRating, predicate);
      },
      ratingcount(item: DimItem, predicate: string) {
        return item.dtrRating && compareByOperand(item.dtrRatingCount, predicate);
      },
      year(item: DimD1Item, predicate: string) {
        switch (predicate) {
          case 'year1':
            return item.year === 1;
          case 'year2':
            return item.year === 2;
          case 'year3':
            return item.year === 3;
          default:
            return false;
        }
      },
      // filter on what vendor an item can come from. Currently supports
      //   * Future War Cult (fwc)
      //   * Dead Orbit (do)
      //   * New Monarchy (nm)
      //   * Speaker (speaker)
      //   * Variks (variks)
      //   * Shipwright (shipwright)
      //   * Osiris: (osiris)
      //   * Xur: (xur)
      //   * Shaxx: (shaxx)
      //   * Crucible Quartermaster (cq)
      //   * Eris Morn (eris)
      //   * Eververse (ev)
      vendor(item: DimD1Item, predicate: string) {
        const vendorHashes = { // identifier
          required: {
            fwc: [995344558], // SOURCE_VENDOR_FUTURE_WAR_CULT
            do: [103311758], // SOURCE_VENDOR_DEAD_ORBIT
            nm: [3072854931], // SOURCE_VENDOR_NEW_MONARCHY
            speaker: [4241664776], // SOURCE_VENDOR_SPEAKER
            variks: [512830513], // SOURCE_VENDOR_FALLEN
            shipwright: [3721473564], // SOURCE_VENDOR_SHIPWRIGHT
            vanguard: [1482793537], // SOURCE_VENDOR_VANGUARD
            osiris: [3378481830], // SOURCE_VENDOR_OSIRIS
            xur: [2179714245], // SOURCE_VENDOR_BLACK_MARKET
            shaxx: [4134961255], // SOURCE_VENDOR_CRUCIBLE_HANDLER
            cq: [1362425043], // SOURCE_VENDOR_CRUCIBLE_QUARTERMASTER
            eris: [1374970038], // SOURCE_VENDOR_CROTAS_BANE
            ev: [3559790162], // SOURCE_VENDOR_SPECIAL_ORDERS
            gunsmith: [353834582] // SOURCE_VENDOR_GUNSMITH
          },
          restricted: {
            fwc: [353834582], // remove motes of light & strange coins
            do: [353834582],
            nm: [353834582],
            speaker: [353834582],
            cq: [353834582, 2682516238] // remove ammo synths and planetary materials
          }
        };
        if (!item) {
          return false;
        }
        if (vendorHashes.restricted[predicate]) {
          return (vendorHashes.required[predicate].some((vendorHash) => item.sourceHashes.includes(vendorHash)) &&
                !(vendorHashes.restricted[predicate].some((vendorHash) => item.sourceHashes.includes(vendorHash))));
        } else {
          return (vendorHashes.required[predicate].some((vendorHash) => item.sourceHashes.includes(vendorHash)));
        }
      },
      // filter on what activity an item can come from. Currently supports
      //   * Vanilla (vanilla)
      //   * Trials (trials)
      //   * Iron Banner (ib)
      //   * Queen's Wrath (qw)
      //   * Crimson Doubles (cd)
      //   * Sparrow Racing League (srl)
      //   * Vault of Glass (vog)
      //   * Crota's End (ce)
      //   * The Taken King (ttk)
      //   * King's Fall (kf)
      //   * Rise of Iron (roi)
      //   * Wrath of the Machine (wotm)
      //   * Prison of Elders (poe)
      //   * Challenge of Elders (coe)
      //   * Archon Forge (af)
      activity(item: DimD1Item, predicate: string) {
        const activityHashes = { // identifier
          required: {
            trials: [2650556703], // SOURCE_TRIALS_OF_OSIRIS
            ib: [1322283879], // SOURCE_IRON_BANNER
            qw: [1983234046], // SOURCE_QUEENS_EMISSARY_QUEST
            cd: [2775576620], // SOURCE_CRIMSON_DOUBLES
            srl: [1234918199], // SOURCE_SRL
            vog: [440710167], // SOURCE_VAULT_OF_GLASS
            ce: [2585003248], // SOURCE_CROTAS_END
            ttk: [2659839637], // SOURCE_TTK
            kf: [1662673928], // SOURCE_KINGS_FALL
            roi: [2964550958], // SOURCE_RISE_OF_IRON
            wotm: [4160622434], // SOURCE_WRATH_OF_THE_MACHINE
            poe: [2784812137], // SOURCE_PRISON_ELDERS
            coe: [1537575125], // SOURCE_POE_ELDER_CHALLENGE
            af: [3667653533], // SOURCE_ARCHON_FORGE
            dawning: [3131490494], // SOURCE_DAWNING
            aot: [3068521220, 4161861381, 440710167] // SOURCE_AGES_OF_TRIUMPH && SOURCE_RAID_REPRISE
          },
          restricted: {
            trials: [2179714245, 2682516238, 560942287], // remove xur exotics and patrol items
            ib: [3602080346], // remove engrams and random blue drops (Strike)
            qw: [3602080346], // remove engrams and random blue drops (Strike)
            cd: [3602080346], // remove engrams and random blue drops (Strike)
            kf: [2179714245, 2682516238, 560942287], // remove xur exotics and patrol items
            wotm: [2179714245, 2682516238, 560942287], // remove xur exotics and patrol items
            poe: [3602080346, 2682516238], // remove engrams
            coe: [3602080346, 2682516238], // remove engrams
            af: [2682516238], // remove engrams
            dawning: [2682516238, 1111209135], // remove engrams, planetary materials, & chroma
            aot: [2964550958, 2659839637, 353834582, 560942287] // Remove ROI, TTK, motes, & glimmer items
          }
        };
        if (!item) {
          return false;
        }
        if (predicate === "vanilla") {
          return item.year === 1;
        } else if (activityHashes.restricted[predicate]) {
          return (activityHashes.required[predicate].some((sourceHash) => item.sourceHashes.includes(sourceHash)) &&
                !(activityHashes.restricted[predicate].some((sourceHash) => item.sourceHashes.includes(sourceHash))));
        } else {
          return (activityHashes.required[predicate].some((sourceHash) => item.sourceHashes.includes(sourceHash)));
        }
      },
      inloadout(item: DimItem) {
        return item.isInLoadout;
      },
      new(item: DimItem) {
        return item.isNew;
      },
      tag(item: DimItem) {
        return item.dimInfo.tag !== undefined;
      },
      hasLight(item: DimItem) {
        const lightBuckets = ["BUCKET_CHEST",
          "BUCKET_LEGS",
          "BUCKET_ARTIFACT",
          "BUCKET_HEAVY_WEAPON",
          "BUCKET_PRIMARY_WEAPON",
          "BUCKET_CLASS_ITEMS",
          "BUCKET_SPECIAL_WEAPON",
          "BUCKET_HEAD",
          "BUCKET_ARMS",
          "BUCKET_GHOST",
          3448274439,
          3551918588,
          14239492,
          20886954,
          1585787867,
          1498876634,
          2465295065,
          953998645
        ];
        return item.primStat && item.bucket && _.contains(lightBuckets, item.bucket.id);
      },
      weapon(item: DimItem) {
        return item.bucket && item.bucket.sort === 'Weapons';
      },
      armor(item: DimItem) {
        return item.bucket && item.bucket.sort === 'Armor';
      },
      cosmetic(item: DimItem) {
        const cosmeticBuckets = [
          "BUCKET_SHADER",
          "BUCKET_MODS",
          "BUCKET_EMOTES",
          "BUCKET_EMBLEM",
          "BUCKET_VEHICLE",
          "BUCKET_SHIP",
          "BUCKET_HORN"
        ];
        return item.bucket && cosmeticBuckets.includes(item.bucket.id.toString());
      },
      equipment(item: DimItem) {
        return item.equipment;
      },
      postmaster(item: DimItem) {
        return item.location && item.location.inPostmaster;
      },
      equipped(item: DimItem) {
        return item.equipped;
      },
      transferable(item: DimItem) {
        return !item.notransfer;
      },
      powermod(item: DimItem) {
        return item.primStat && (item.primStat.value !== item.basePower);
      },
      rpm: filterByStats('rpm'),
      charge: filterByStats('charge'),
      rof: filterByStats('rof'),
      impact: filterByStats('impact'),
      range: filterByStats('range'),
      stability: filterByStats('stability'),
      reload: filterByStats('reload'),
      magazine: filterByStats('magazine'),
      aimassist: filterByStats('aimassist'),
      equipspeed: filterByStats('equipspeed')
    }
  };
}
