import { compact } from 'app/utils/collections';
import { emptyArray } from 'app/utils/empty';

// Exotic class items' exotic intrinsic sockets don't correspond to plug sets.
// Thus we have to maintain manual lists of what can roll for each.
export const exoticClassItemPlugs: {
  [itemHash: number]: { [socketIndex: number]: number[] | undefined } | undefined;
} = {
  266021826: {
    10: [
      1476923952, 1476923953, 1476923954, 3573490509, 3573490508, 3573490511, 3573490510,
      3573490505,
    ],
    11: [
      1476923955, 1476923956, 1476923957, 3573490504, 3573490507, 3573490506, 3573490501,
      3573490500,
    ],
  },
  2273643087: {
    10: [1476923952, 1476923953, 1476923954, 183430248, 183430255, 183430252, 183430253, 183430250],
    11: [1476923955, 1476923956, 1476923957, 183430251, 183430254, 183430249, 183430246, 183430247],
  },
  2809120022: {
    10: [
      1476923952, 1476923953, 1476923954, 3751917999, 3751917998, 3751917997, 3751917996,
      3751917995,
    ],
    11: [
      1476923955, 1476923956, 1476923957, 3751917994, 3751917993, 3751917992, 3751917991,
      3751917990,
    ],
  },
};

/**
 * All possible exotic intrinsic perk hashes for a given exotic class item, flattened across both
 * intrinsic perk sockets. Used to scope perk-clearing operations to perks owned by the exotic
 * class item picker, leaving any other intrinsic perks untouched.
 */
export function getExoticClassItemPerkHashes(exoticHash: number | undefined): number[] {
  const plugs = exoticHash !== undefined && exoticClassItemPlugs[exoticHash];
  return plugs ? compact(Object.values(plugs)).flat() : emptyArray();
}

/**
 * Whether the given item hash corresponds to an exotic class item we have perk-picker support
 * for (i.e. has an entry in {@link exoticClassItemPlugs}).
 */
export function isExoticClassItemWithPerks(itemHash: number | undefined): boolean {
  return itemHash !== undefined && exoticClassItemPlugs[itemHash] !== undefined;
}

/**
 * Returns the full list of perk hashes for whichever intrinsic perk column contains the given
 * perk hash on the given exotic class item. Returns undefined if the exotic or perk isn't tracked
 * in our manual table. Used to enforce one-perk-per-column when toggling perks.
 */
export function getExoticClassItemPerkColumn(
  exoticHash: number | undefined,
  perkHash: number,
): number[] | undefined {
  if (exoticHash === undefined) {
    return undefined;
  }
  const plugsBySocket = exoticClassItemPlugs[exoticHash];
  if (!plugsBySocket) {
    return undefined;
  }
  for (const plugs of Object.values(plugsBySocket)) {
    if (plugs?.includes(perkHash)) {
      return plugs;
    }
  }
  return undefined;
}
