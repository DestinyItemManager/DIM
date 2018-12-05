import { CuratedRoll, DimWishList } from './curatedRoll';
import * as _ from 'lodash';

/** Translate a single banshee-44.com URL -> CuratedRoll. */
function toCuratedRoll(bansheeTextLine: string): CuratedRoll | null {
  if (!bansheeTextLine || bansheeTextLine.length === 0) {
    return null;
  }

  const matchResults = bansheeTextLine.match(
    /https:\/\/banshee-44\.com\/\?weapon=(\d.+)&socketEntries=(.*)/
  );

  if (!matchResults || matchResults.length !== 3) {
    return null;
  }

  const itemHash = Number(matchResults[1]);
  const recommendedPerks = matchResults[2]
    .split(',')
    .map(Number)
    .filter((perkHash) => perkHash > 0);

  return {
    itemHash,
    recommendedPerks
  };
}

function toDimWishListCuratedRoll(textLine: string): CuratedRoll | null {
  if (!textLine || textLine.length === 0) {
    return null;
  }

  const matchResults = textLine.match(/dimwishlist:item=(-?\d.+)&perks=(.*)/);

  if (!matchResults || matchResults.length !== 3) {
    return null;
  }

  const itemHash = Number(matchResults[1]);

  if (itemHash < 0 && itemHash !== DimWishList.WildcardItemId) {
    return null;
  }

  const recommendedPerks = matchResults[2]
    .split(',')
    .map(Number)
    .filter((perkHash) => perkHash > 0);

  return {
    itemHash,
    recommendedPerks
  };
}

/** Newline-separated banshee-44.com text -> CuratedRolls. */
export function toCuratedRolls(bansheeText: string): CuratedRoll[] {
  const textArray = bansheeText.split('\n');

  return _.compact(textArray.map(toCuratedRoll).concat(textArray.map(toDimWishListCuratedRoll)));
}
