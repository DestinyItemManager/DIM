import * as _ from 'lodash';
import { count } from '../util';
import { D2Item, DimSocket } from '../inventory/item-types';
import { D2ItemUserReview } from '../item-review/d2-dtr-api-types';
import { dtrTextReviewMultiplier } from './dtr-service-helper';

export interface RatingAndReview {
  ratingCount: number;
  averageReview: number;
  plugOptionHash: number;
}

/**
 * Rate the perks on a Destiny 2 item based off of its attached user reviews.
 */
export function ratePerks(item: D2Item) {
  if (
    !item.dtrRating ||
    !item.dtrRating.reviewsResponse ||
    !item.dtrRating.reviewsResponse.reviews.length ||
    !item.sockets ||
    !item.sockets.sockets
  ) {
    return;
  }

  const itemReviews = item.dtrRating.reviewsResponse.reviews;

  item.sockets.sockets.forEach((socket) => {
    if (socket.plugOptions.length && socket.plugOptions.length > 1) {
      const plugOptionHashes = socket.plugOptions.map((po) => po.plugItem.hash);

      const anyOrnamentsOrCatalysts = socket.plugOptions.some(
        (po) =>
          po.plugItem.itemCategoryHashes.some(
            (ich) => ich === 3124752623 || ich === 141186804 // weapon mods: ornaments, masterworks mods
          ) || po.plugItem.hash === 3547298846 // upgrade masterwork
      );

      if (!anyOrnamentsOrCatalysts) {
        const ratingsAndReviews = plugOptionHashes.map((plugOptionHash) =>
          getPlugRatingsAndReviewCount(plugOptionHash, itemReviews)
        );

        const maxReview = getMaxReview(ratingsAndReviews);

        markPlugAsBest(maxReview, socket);
      }
    }
  });
}

function markPlugAsBest(maxReview: RatingAndReview | null, socket: DimSocket) {
  if (!maxReview) {
    return;
  }

  const matchingPlugOption = socket.plugOptions.find(
    (plugOption) => plugOption.plugItem.hash === maxReview.plugOptionHash
  );

  if (matchingPlugOption) {
    matchingPlugOption.bestRated = true;
  }
}

function getMaxReview(ratingsAndReviews: RatingAndReview[]) {
  const orderedRatingsAndReviews = _.sortBy(ratingsAndReviews, (ratingAndReview) =>
    ratingAndReview.ratingCount < 2 ? 0 : ratingAndReview.averageReview
  ).reverse();

  if (orderedRatingsAndReviews.length > 0 && orderedRatingsAndReviews[0].ratingCount > 1) {
    return orderedRatingsAndReviews[0];
  }

  return null;
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
    plugOptionHash
  };

  return ratingAndReview;
}

function getMatchingReviews(plugOptionHash: number, reviews: D2ItemUserReview[]) {
  return reviews.filter((review) => {
    return (
      (review.selectedPerks && review.selectedPerks.includes(plugOptionHash)) ||
      (review.attachedMods && review.attachedMods.includes(plugOptionHash))
    );
  });
}
