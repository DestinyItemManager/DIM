import { CuratedRoll, DimWishList, CuratedRollsAndInfo } from './curatedRoll';
import _ from 'lodash';
import { getTitle, getDescription } from './curated-roll-metadata-reader';

/** Translate a single banshee-44.com URL -> CuratedRoll. */
function toCuratedRoll(bansheeTextLine: string): CuratedRoll | null {
  if (!bansheeTextLine || bansheeTextLine.length === 0) {
    return null;
  }

  if (bansheeTextLine.startsWith('//')) {
    return null;
  }

  const matchResults = bansheeTextLine.match(
    /^https:\/\/banshee-44\.com\/\?weapon=(\d.+)&socketEntries=(.*)/
  );

  if (!matchResults || matchResults.length !== 3) {
    return null;
  }

  const itemHash = Number(matchResults[1]);
  const recommendedPerks = new Set(
    matchResults[2]
      .split(',')
      .map(Number)
      .filter((perkHash) => perkHash > 0)
  );

  return {
    itemHash,
    recommendedPerks,
    isExpertMode: false
  };
}

function toDimWishListCuratedRoll(textLine: string): CuratedRoll | null {
  if (!textLine || textLine.length === 0) {
    return null;
  }

  if (textLine.startsWith('//')) {
    return null;
  }

  const matchResults = textLine.match(/^dimwishlist:item=(-?\d+)&perks=([\d|,]*)/);

  if (!matchResults || matchResults.length !== 3) {
    return null;
  }

  const itemHash = Number(matchResults[1]);

  if (itemHash < 0 && itemHash !== DimWishList.WildcardItemId) {
    return null;
  }

  const recommendedPerks = new Set(
    matchResults[2]
      .split(',')
      .map(Number)
      .filter((perkHash) => perkHash > 0)
  );

  return {
    itemHash,
    recommendedPerks,
    isExpertMode: true
  };
}

/** Newline-separated banshee-44.com text -> CuratedRolls. */
function toCuratedRolls(fileText: string): CuratedRoll[] {
  const textArray = fileText.split('\n');

  const rolls = _.compact(
    textArray.map((line) => toDimWishListCuratedRoll(line) || toCuratedRoll(line))
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

/**
 * Extracts rolls, title, and description from the meat of
 * a wish list text file.
 */
export function toCuratedRollsAndInfo(fileText: string): CuratedRollsAndInfo {
  return {
    curatedRolls: toCuratedRolls(fileText),
    title: getTitle(fileText),
    description: getDescription(fileText)
  };
}
