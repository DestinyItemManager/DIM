import { emptySet } from 'app/utils/empty';
import { timer, warnLog } from 'app/utils/log';
import { DimWishList, WishListAndInfo, WishListInfo, WishListRoll } from './types';

const TAG = 'wishlist';

/**
 * The title should follow the following format:
 * title:This Is My Source File Title.
 */
const titleLabel = /^@?title:(.+)$/;
/**
 * The description should follow the following format:
 * description:This Is My Source File Description And Maybe It Is Longer.
 */
const descriptionLabel = /^@?description:(.+)$/;
/**
 * Notes apply to all rolls until an empty line or comment.
 */
const notesLabel = '//notes:';

/**
 * Little Light uses this hash to mean "Any Perk" in a slot.
 */
const LITTLE_LIGHT_ANY_PERK = 29505215;

export interface LittleLightRoll {
  hash: number;
  plugs: number[][];
  tags?: string[];
  description?: string;
  name?: string;
}

export interface LittleLightWishList {
  name?: string;
  description?: string;
  data: LittleLightRoll[];
}

/**
 * Extracts rolls, title, and description from the meat of
 * one or more wish list text files, deduplicating within
 * and between lists.
 */
export function toWishList(files: [url: string | undefined, contents: string][]): WishListAndInfo {
  const stopTimer = timer(TAG, 'Parse wish list');
  try {
    const wishList: WishListAndInfo = {
      wishListRolls: [],
      infos: [],
    };

    const seen = new Set<string>();

    for (const [url, fileText] of files) {
      const info: WishListInfo = {
        url,
        title: undefined,
        description: undefined,
        numRolls: 0,
        dupeRolls: 0,
      };

      const trimmedText = fileText.trim();
      if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
        try {
          const json = JSON.parse(trimmedText) as LittleLightWishList;
          if (json.data && Array.isArray(json.data)) {
            info.title = json.name;
            info.description = json.description;

            for (const llRoll of json.data) {
              const rolls = parseLittleLightWishListRoll(llRoll);
              for (const roll of rolls) {
                const rollHash = `${roll.itemHash};${roll.isExpertMode};${sortedSetToString(
                  roll.recommendedPerks,
                )}`;

                if (!seen.has(rollHash)) {
                  seen.add(rollHash);
                  wishList.wishListRolls.push(roll);
                  info.numRolls++;
                } else {
                  info.dupeRolls++;
                }
                roll.sourceWishListIndex = wishList.infos.length;
                roll.title = info.title;
                roll.description = info.description;
              }
            }

            if (info.dupeRolls > 0) {
              warnLog(TAG, 'Discarded', info.dupeRolls, 'duplicate rolls from wish list', url);
            }
            wishList.infos.push(info);
            continue;
          }
        } catch (e) {
          warnLog(TAG, 'Failed to parse wishlist as JSON', e);
        }
      }

      let blockNotes: string | undefined = undefined;
      let title: string | undefined = undefined;
      let description: string | undefined = undefined;
      let match: RegExpExecArray | null = null;
      const lines = fileText.split('\n');
      for (const line of lines) {
        if (line.startsWith(notesLabel)) {
          blockNotes = parseBlockNoteLine(line);
        } else if (line.length === 0 || line.startsWith('//')) {
          // Empty lines and comments reset the block note
          blockNotes = undefined;
        } else if ((match = titleLabel.exec(line))) {
          title = match[1];
          if (!info.title) {
            info.title = title.trim();
          }
        } else if ((match = descriptionLabel.exec(line))) {
          description = match[1].trim();
          if (!info.description) {
            info.description = description;
          }
        } else {
          const roll = toDimWishListRoll(line, blockNotes);

          if (roll) {
            const rollHash = `${roll.itemHash};${roll.isExpertMode};${sortedSetToString(
              roll.recommendedPerks,
            )}`;

            if (!seen.has(rollHash)) {
              seen.add(rollHash);
              wishList.wishListRolls.push(roll);
              info.numRolls++;
            } else {
              info.dupeRolls++;
            }
            roll.sourceWishListIndex = wishList.infos.length;
            roll.title = title;
            roll.description = description;
          }
        }
      }
      if (info.dupeRolls > 0) {
        warnLog(TAG, 'Discarded', info.dupeRolls, 'duplicate rolls from wish list', url);
      }
      wishList.infos.push(info);
    }
    return wishList;
  } finally {
    stopTimer();
  }
}

/**
 * Little Light wish lists specify rolls as a list of columns, each containing a list of perks.
 * To match DIM's current engine, we must expand these into all possible combinations
 * and treat them as "expert" rolls (where all specified perks must be present).
 */
function parseLittleLightWishListRoll(llRoll: LittleLightRoll): WishListRoll[] {
  if (!llRoll.hash || !llRoll.plugs || llRoll.plugs.length === 0) {
    return [];
  }

  // Filter out empty columns, non-positive perk hashes, and the Little Light "Any" placeholder
  const columns = llRoll.plugs
    .map((column) =>
      column.filter((perkHash) => perkHash > 0 && perkHash !== LITTLE_LIGHT_ANY_PERK),
    )
    .filter((column) => column.length > 0);

  if (columns.length === 0) {
    return [];
  }

  const notesParts: string[] = [];
  if (llRoll.tags && llRoll.tags.length > 0) {
    notesParts.push(`Tags: ${llRoll.tags.join(', ')}`);
  }
  if (llRoll.name) {
    notesParts.push(`Name: ${llRoll.name}`);
  }
  if (llRoll.description) {
    notesParts.push(`Notes: ${llRoll.description}`);
  }
  const notes = notesParts.length > 0 ? notesParts.join(' | ') : undefined;

  // Generate Cartesian product of all columns
  let combinations: number[][] = [[]];
  for (const column of columns) {
    const nextCombinations: number[][] = [];
    for (const combination of combinations) {
      for (const perkHash of column) {
        nextCombinations.push([...combination, perkHash]);
      }
    }
    combinations = nextCombinations;

    // Safety break to prevent exponential explosion if a list is crazy
    if (combinations.length > 500) {
      break;
    }
  }

  return combinations.map((perks) => ({
    itemHash: llRoll.hash,
    recommendedPerks: new Set(perks),
    isExpertMode: true,
    notes,
  }));
}

function expectedMatchResultsLength(matchResults: RegExpMatchArray): boolean {
  return matchResults.length === 4;
}

const blockNoteLineRegex = /^\/\/notes:(?<blockNotes>[^|]*)/;

/** Parse out notes from a line */
function parseBlockNoteLine(blockNoteLine: string): string | undefined {
  const blockMatchResults = blockNoteLineRegex.exec(blockNoteLine);
  return blockMatchResults?.groups?.blockNotes;
}

function getPerks(matchResults: RegExpMatchArray): Set<number> {
  if (matchResults.groups?.itemPerks === undefined) {
    return emptySet<number>();
  }

  const split = matchResults[2].split(',');

  const s = new Set<number>();
  for (const perkHash of split) {
    const n = Number(perkHash);
    if (n > 0 && n !== LITTLE_LIGHT_ANY_PERK) {
      s.add(n);
    }
  }

  return s;
}

function getNotes(matchResults: RegExpMatchArray, blockNotes?: string): string | undefined {
  const notes =
    matchResults.groups?.wishListNotes && matchResults.groups.wishListNotes.length > 1
      ? matchResults.groups.wishListNotes
      : blockNotes;
  return notes?.replace(/\\n/g, '\n');
}

function getItemHash(matchResults: RegExpMatchArray): number {
  if (!matchResults.groups) {
    return 0;
  }

  return Number(matchResults.groups.itemHash);
}

const textLineRegex =
  /^dimwishlist:item=(?<itemHash>-?\d+)(?:&perks=)?(?<itemPerks>[\d|,]*)(?:#notes:)?(?<wishListNotes>[^|]*)/;
function toDimWishListRoll(textLine: string, blockNotes?: string): WishListRoll | null {
  const matchResults = textLineRegex.exec(textLine);

  if (!matchResults || !expectedMatchResultsLength(matchResults)) {
    return null;
  }

  let itemHash = getItemHash(matchResults);
  const isUndesirable = itemHash < 0 && itemHash !== DimWishList.WildcardItemId;
  const recommendedPerks = getPerks(matchResults);
  const notes = getNotes(matchResults, blockNotes);

  if (isUndesirable && itemHash !== DimWishList.WildcardItemId) {
    itemHash = Math.abs(itemHash);
  }

  return {
    itemHash,
    recommendedPerks,
    isExpertMode: true,
    notes,
    isUndesirable,
  };
}

function sortedSetToString(set: Set<number>): string {
  return [...set].sort((a, b) => a - b).toString();
}
