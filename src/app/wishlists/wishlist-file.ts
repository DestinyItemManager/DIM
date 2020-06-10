import { WishListRoll, DimWishList, WishListAndInfo } from './types';
import { emptySet } from 'app/utils/empty';

let blockNotes: string | undefined;

/* Utilities for reading a wishlist file */

/**
 * Extracts rolls, title, and description from the meat of
 * a wish list text file.
 */
export function toWishList(fileText: string): WishListAndInfo {
  try {
    console.time('Parse wish list');
    return {
      wishListRolls: toWishListRolls(fileText),
      title: getTitle(fileText),
      description: getDescription(fileText),
    };
  } finally {
    console.timeEnd('Parse wish list');
  }
}

function expectedMatchResultsLength(matchResults: RegExpMatchArray): boolean {
  return matchResults.length === 4;
}

const blockNoteLineRegex = /^\/\/notes:(?<blockNotes>[^|]*)/;

/** Side effect-y function that will set/unset block notes */
function parseBlockNoteLine(blockNoteLine: string): null {
  const blockMatchResults = blockNoteLineRegex.exec(blockNoteLine);

  blockNotes = blockMatchResults?.groups?.blockNotes;

  return null;
}

function getPerks(matchResults: RegExpMatchArray): Set<number> {
  if (!matchResults.groups || matchResults.groups.itemPerks === undefined) {
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

function getNotes(matchResults: RegExpMatchArray): string | undefined {
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

const dtrTextLineRegex = /^https:\/\/destinytracker\.com\/destiny-2\/db\/items\/(?<itemHash>\d+)(?:.*)?perks=(?<itemPerks>[\d,]*)(?:#notes:)?(?<wishListNotes>[^|]*)?/;
function toDtrWishListRoll(dtrTextLine: string): WishListRoll | null {
  if (!dtrTextLine || dtrTextLine.length === 0) {
    return null;
  }

  if (dtrTextLine.startsWith('//')) {
    return null;
  }

  const matchResults = dtrTextLineRegex.exec(dtrTextLine);

  if (!matchResults || !expectedMatchResultsLength(matchResults)) {
    return null;
  }

  const itemHash = getItemHash(matchResults);
  const recommendedPerks = getPerks(matchResults);
  const notes = getNotes(matchResults);

  return {
    itemHash,
    recommendedPerks,
    isExpertMode: false,
    notes,
  };
}

const bansheeTextLineRegex = /^https:\/\/banshee-44\.com\/\?weapon=(?<itemHash>\d.+)&socketEntries=(?<itemPerks>[\d,]*)(?:#notes:)?(?<wishListNotes>[^|]*)?/;

/** Translate a single banshee-44.com URL -> WishListRoll. */
function toBansheeWishListRoll(bansheeTextLine: string): WishListRoll | null {
  if (!bansheeTextLine || bansheeTextLine.length === 0) {
    return null;
  }

  if (bansheeTextLine.startsWith('//')) {
    return null;
  }

  const matchResults = bansheeTextLineRegex.exec(bansheeTextLine);

  if (!matchResults || !expectedMatchResultsLength(matchResults)) {
    return null;
  }

  const itemHash = getItemHash(matchResults);
  const recommendedPerks = getPerks(matchResults);
  const notes = getNotes(matchResults);

  return {
    itemHash,
    recommendedPerks,
    isExpertMode: false,
    notes,
  };
}

const textLineRegex = /^dimwishlist:item=(?<itemHash>-?\d+)(?:&perks=)?(?<itemPerks>[\d|,]*)?(?:#notes:)?(?<wishListNotes>[^|]*)?/;
function toDimWishListRoll(textLine: string): WishListRoll | null {
  if (!textLine || textLine.length === 0) {
    return null;
  }

  if (textLine.startsWith('//')) {
    return null;
  }

  const matchResults = textLineRegex.exec(textLine);

  if (!matchResults || !expectedMatchResultsLength(matchResults)) {
    return null;
  }

  let itemHash = getItemHash(matchResults);
  const isUndesirable = itemHash < 0 && itemHash !== DimWishList.WildcardItemId;
  const recommendedPerks = getPerks(matchResults);
  const notes = getNotes(matchResults);

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

/** Newline-separated banshee-44.com text -> WishListRolls. */
function toWishListRolls(fileText: string): WishListRoll[] {
  const textArray = fileText.split('\n');

  const rolls: WishListRoll[] = [];
  for (const line of textArray) {
    const roll =
      toDimWishListRoll(line) ||
      toBansheeWishListRoll(line) ||
      toDtrWishListRoll(line) ||
      parseBlockNoteLine(line);

    if (roll) {
      rolls.push(roll);
    }
  }

  const seen = new Set<string>();
  const ret: WishListRoll[] = [];
  for (const roll of rolls) {
    const rollHash = `${roll.itemHash};${roll.isExpertMode};${sortedSetToString(
      roll.recommendedPerks
    )}`;
    if (!seen.has(rollHash)) {
      seen.add(rollHash);
      ret.push(roll);
    }
  }

  return ret;
}

function findMatch(sourceFileLine: string, regExToMatch: RegExp): string | undefined {
  if (!sourceFileLine || !sourceFileLine.length) {
    return undefined;
  }

  const matchResults = sourceFileLine.match(regExToMatch);

  if (!matchResults || matchResults.length !== 2) {
    return undefined;
  }

  return matchResults[1];
}

function findTitle(sourceFileLine: string): string | undefined {
  return findMatch(sourceFileLine, /^title:(.*)/);
}

function findDescription(sourceFileLine: string): string | undefined {
  return findMatch(sourceFileLine, /^description:(.*)/);
}

/*
 * Will extract the title of a DIM wish list from a source file.
 * The title should follow the following format:
 * title:This Is My Source File Title.
 *
 * It will only look at the first 20 lines of the file for the title,
 * and the first line that looks like a title will be returned.
 */
function getTitle(sourceFileText: string): string | undefined {
  if (!sourceFileText) {
    return undefined;
  }

  const sourceFileLineArray = sourceFileText.split('\n').slice(0, 20);

  return sourceFileLineArray.map(findTitle).find((s) => s);
}

/*
 * Will extract the description of a DIM wish list from a source file.
 * The description should follow the following format:
 * description:This Is My Source File Description And Maybe It Is Longer.
 *
 * It will only look at the first 20 lines of the file for the description,
 * and the first line that looks like a description will be returned.
 */
function getDescription(sourceFileText: string): string | undefined {
  if (!sourceFileText) {
    return undefined;
  }

  const sourceFileLineArray = sourceFileText.split('\n').slice(0, 20);

  return sourceFileLineArray.map(findDescription).find(Boolean);
}
