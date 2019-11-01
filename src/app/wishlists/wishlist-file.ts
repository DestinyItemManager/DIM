import { WishListRoll, DimWishList, WishListAndInfo } from './types';
import _ from 'lodash';

/* Utilities for reading a wishlist file */

/**
 * Extracts rolls, title, and description from the meat of
 * a wish list text file.
 */
export function toWishList(fileText: string): WishListAndInfo {
  return {
    wishListRolls: toWishListRolls(fileText),
    title: getTitle(fileText),
    description: getDescription(fileText)
  };
}

function expectedMatchResultsLength(matchResults: RegExpMatchArray): boolean {
  return matchResults.length === 4;
}

function getPerks(matchResults: RegExpMatchArray): Set<number> {
  return new Set(
    matchResults[2]
      .split(',')
      .map(Number)
      .filter((perkHash) => perkHash > 0)
  );
}

function getNotes(matchResults: RegExpMatchArray): string | undefined {
  return matchResults[3] ? matchResults[3] : undefined;
}

function getItemHash(matchResults: RegExpMatchArray): number {
  return Number(matchResults[1]);
}

function toDtrWishListRoll(dtrTextLine: string): WishListRoll | null {
  if (!dtrTextLine || dtrTextLine.length === 0) {
    return null;
  }

  if (dtrTextLine.startsWith('//')) {
    return null;
  }

  const matchResults = dtrTextLine.match(
    /^https:\/\/destinytracker\.com\/destiny-2\/db\/items\/(\d+)(?:.*)?perks=([\d,]*)(?:#notes:)?(.*)?/
  );

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
    notes
  };
}

/** Translate a single banshee-44.com URL -> WishListRoll. */
function toBansheeWishListRoll(bansheeTextLine: string): WishListRoll | null {
  if (!bansheeTextLine || bansheeTextLine.length === 0) {
    return null;
  }

  if (bansheeTextLine.startsWith('//')) {
    return null;
  }

  const matchResults = bansheeTextLine.match(
    /^https:\/\/banshee-44\.com\/\?weapon=(\d.+)&socketEntries=([\d,]*)(?:#notes:)?(.*)?/
  );

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
    notes
  };
}

function toDimWishListRoll(textLine: string): WishListRoll | null {
  if (!textLine || textLine.length === 0) {
    return null;
  }

  if (textLine.startsWith('//')) {
    return null;
  }

  const matchResults = textLine.match(/^dimwishlist:item=(-?\d+)&perks=([\d|,]*)(?:#notes:)?(.*)?/);

  if (!matchResults || !expectedMatchResultsLength(matchResults)) {
    return null;
  }

  const itemHash = getItemHash(matchResults);

  if (itemHash < 0 && itemHash !== DimWishList.WildcardItemId) {
    return null;
  }

  const recommendedPerks = getPerks(matchResults);
  const notes = getNotes(matchResults);

  return {
    itemHash,
    recommendedPerks,
    isExpertMode: true,
    notes
  };
}

/** Newline-separated banshee-44.com text -> WishListRolls. */
function toWishListRolls(fileText: string): WishListRoll[] {
  const textArray = fileText.split('\n');

  const rolls = _.compact(
    textArray.map(
      (line) => toDimWishListRoll(line) || toBansheeWishListRoll(line) || toDtrWishListRoll(line)
    )
  );

  function eqSet<T>(as: Set<T>, bs: Set<T>) {
    if (as.size !== bs.size) {
      return false;
    }
    for (const a of as) {
      if (!bs.has(a)) {
        return false;
      }
    }
    return true;
  }
  return Object.values(
    _.mapValues(_.groupBy(rolls, (r) => r.itemHash), (v) =>
      _.uniqWith(
        v,
        (v1, v2) =>
          v1.isExpertMode === v2.isExpertMode && eqSet(v1.recommendedPerks, v2.recommendedPerks)
      )
    )
  ).flat();
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
