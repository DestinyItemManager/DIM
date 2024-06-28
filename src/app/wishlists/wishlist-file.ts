import { emptySet } from 'app/utils/empty';
import { timer, warnLog } from 'app/utils/log';
import { DimWishList, WishListAndInfo, WishListInfo, WishListRoll } from './types';

const TAG = 'wishlist';

/**
 * The title should follow the following format:
 * title:This Is My Source File Title.
 */
const titleLabel = 'title:';
/**
 * The description should follow the following format:
 * description:This Is My Source File Description And Maybe It Is Longer.
 */
const descriptionLabel = 'description:';
/**
 * Notes apply to all rolls until an empty line or comment.
 */
const notesLabel = '//notes:';

/**
 * Extracts rolls, title, and description from the meat of
 * one or more wish list text files, deduplicating within
 * and between lists.
 */
export function toWishList(
  ...files: [url: string | undefined, contents: string][]
): WishListAndInfo {
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
      };
      let dupes = 0;

      let blockNotes: string | undefined = undefined;

      const lines = fileText.split('\n');
      for (const line of lines) {
        if (line.startsWith(notesLabel)) {
          blockNotes = parseBlockNoteLine(line);
        } else if (line.length === 0 || line.startsWith('//')) {
          // Empty lines and comments reset the block note
          blockNotes = undefined;
        } else if (!info.title && line.startsWith(titleLabel)) {
          info.title = line.slice(titleLabel.length);
        } else if (!info.description && line.startsWith(descriptionLabel)) {
          info.description = line.slice(descriptionLabel.length);
        } else {
          const roll =
            toDimWishListRoll(line, blockNotes) ||
            toBansheeWishListRoll(line, blockNotes) ||
            toDtrWishListRoll(line, blockNotes);

          if (roll) {
            const rollHash = `${roll.itemHash};${roll.isExpertMode};${sortedSetToString(
              roll.recommendedPerks,
            )}`;

            if (!seen.has(rollHash)) {
              seen.add(rollHash);
              wishList.wishListRolls.push(roll);
              info.numRolls++;
            } else {
              dupes++;
            }
          }
        }
      }

      if (dupes > 0) {
        warnLog(TAG, 'Discarded', dupes, 'duplicate rolls from wish list', url);
      }
      wishList.infos.push(info);
    }
    return wishList;
  } finally {
    stopTimer();
  }
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
    if (n > 0) {
      s.add(n);
    }
  }

  return s;
}

function getNotes(matchResults: RegExpMatchArray, blockNotes?: string): string | undefined {
  return matchResults.groups?.wishListNotes && matchResults.groups.wishListNotes.length > 1
    ? matchResults.groups.wishListNotes
    : blockNotes;
}

function getItemHash(matchResults: RegExpMatchArray): number {
  if (!matchResults.groups) {
    return 0;
  }

  return Number(matchResults.groups.itemHash);
}

const dtrTextLineRegex =
  /^https:\/\/destinytracker\.com\/destiny-2\/db\/items\/(?<itemHash>\d+)(?:.*)?perks=(?<itemPerks>[\d,]*)(?:#notes:)?(?<wishListNotes>[^|]*)?/;
function toDtrWishListRoll(dtrTextLine: string, blockNotes?: string): WishListRoll | null {
  const matchResults = dtrTextLineRegex.exec(dtrTextLine);

  if (!matchResults || !expectedMatchResultsLength(matchResults)) {
    return null;
  }

  const itemHash = getItemHash(matchResults);
  const recommendedPerks = getPerks(matchResults);
  const notes = getNotes(matchResults, blockNotes);

  return {
    itemHash,
    recommendedPerks,
    isExpertMode: false,
    notes,
  };
}

const bansheeTextLineRegex =
  /^https:\/\/banshee-44\.com\/\?weapon=(?<itemHash>\d.+)&socketEntries=(?<itemPerks>[\d,]*)(?:#notes:)?(?<wishListNotes>[^|]*)?/;

/** Translate a single banshee-44.com URL -> WishListRoll. */
function toBansheeWishListRoll(bansheeTextLine: string, blockNotes?: string): WishListRoll | null {
  const matchResults = bansheeTextLineRegex.exec(bansheeTextLine);

  if (!matchResults || !expectedMatchResultsLength(matchResults)) {
    return null;
  }

  const itemHash = getItemHash(matchResults);
  const recommendedPerks = getPerks(matchResults);
  const notes = getNotes(matchResults, blockNotes);

  return {
    itemHash,
    recommendedPerks,
    isExpertMode: false,
    notes,
  };
}

const textLineRegex =
  /^dimwishlist:item=(?<itemHash>-?\d+)(?:&perks=)?(?<itemPerks>[\d|,]*)?(?:#notes:)?(?<wishListNotes>[^|]*)?/;
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
