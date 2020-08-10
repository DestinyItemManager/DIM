import _ from 'lodash';
import { count } from '../utils/util';
import { D2Item } from '../inventory/item-types';
import { D2ItemUserReview } from '../item-review/d2-dtr-api-types';
import { dtrTextReviewMultiplier } from './dtr-service-helper';
import { UPGRADE_MASTERWORK } from 'app/search/d2-known-values';
import { ItemCategoryHashes } from 'data/d2/generated-enums';

export interface RatingAndReview {
  ratingCount: number;
  averageReview: number;
  plugOptionHash: number;
}

/**
 * Rate the perks on a Destiny 2 item based off of its attached user reviews.
 *
 * @returns a set of perk hashes that are best-rated.
 */
export function ratePerks(item: D2Item, itemReviews?: D2ItemUserReview[]): Set<number> {
  const bestRated = new Set<number>();

  if (!item.sockets || !item.sockets.allSockets || !itemReviews || !itemReviews.length) {
    return bestRated;
  }

  // TODO: just go through the reviews building up a count of positives per plug first!

  item.sockets.allSockets.forEach((socket) => {
    if (socket.plugOptions.length > 1) {
      const plugOptionHashes = socket.plugOptions.map((po) => po.plugDef.hash);

      const anyOrnamentsOrCatalysts = socket.plugOptions.some(
        (po) =>
          po.plugDef.itemCategoryHashes?.some(
            (ich) =>
              ich === ItemCategoryHashes.WeaponModsOrnaments ||
              ich === ItemCategoryHashes.MasterworksMods
          ) || po.plugDef.hash === UPGRADE_MASTERWORK
      );

      if (!anyOrnamentsOrCatalysts) {
        const ratingsAndReviews = plugOptionHashes.map((plugOptionHash) =>
          getPlugRatingsAndReviewCount(plugOptionHash, itemReviews)
        );

        const maxReview = getMaxReview(ratingsAndReviews);

        if (maxReview) {
          bestRated.add(maxReview.plugOptionHash);
        }
      }
    }
  });

  return bestRated;
}

function getMaxReview(ratingsAndReviews: RatingAndReview[]) {
  return _.maxBy(
    ratingsAndReviews.filter((r) => r.ratingCount >= 2),
    (r) => r.averageReview
  );
}

function getPlugRatingsAndReviewCount(
  plugOptionHash: number,
  reviews: D2ItemUserReview[]
): RatingAndReview {
  const matchingReviews = getMatchingReviews(plugOptionHash, reviews);
  const matchingReviewsWithTextCount = count(matchingReviews, (mr) => Boolean(mr.text));

  const ratingCount =
    matchingReviews.length + matchingReviewsWithTextCount * dtrTextReviewMultiplier;
  const averageReview =
    _.sumBy(matchingReviews, (r) => (r.text ? r.voted * (dtrTextReviewMultiplier + 1) : r.voted)) /
      ratingCount || 1;

  const ratingAndReview = {
    ratingCount,
    averageReview,
    plugOptionHash,
  };

  return ratingAndReview;
}

function getMatchingReviews(plugOptionHash: number, reviews: D2ItemUserReview[]) {
  return reviews.filter(
    (review) =>
      review.selectedPerks?.includes(plugOptionHash) ||
      review.attachedMods?.includes(plugOptionHash)
  );
}
