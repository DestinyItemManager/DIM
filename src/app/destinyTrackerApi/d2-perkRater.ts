import * as _ from 'underscore';
import { DtrUserReview } from '../item-review/destiny-tracker.service';
import { sum } from '../util';
import { D2Item, DimSocket } from '../inventory/item-types';

export interface RatingAndReview {
  ratingCount: number;
  averageReview: number;
  plugOptionHash: number;
}

/**
 * Rate the perks on a Destiny 2 item based off of its attached user reviews.
 */
export function ratePerks(item: D2Item) {
  if (!item.reviews ||
      !item.reviews.length ||
      !item.sockets ||
      !item.sockets.sockets) {
    return;
  }

  item.sockets.sockets.forEach((socket) => {
    if ((socket.plugOptions.length) &&
        (socket.plugOptions.length > 1)) {
      const plugOptionHashes = socket.plugOptions.map((i) => i.plugItem.hash);

      const ratingsAndReviews = plugOptionHashes.map((plugOptionHash) => getPlugRatingsAndReviewCount(plugOptionHash, item.reviews));

      const maxReview = getMaxReview(ratingsAndReviews);

      markPlugAsBest(maxReview, socket);
    }
  });
}

function markPlugAsBest(
  maxReview: RatingAndReview | null,
  socket: DimSocket
) {
  if (!maxReview) {
    return;
  }

  const matchingPlugOption = socket.plugOptions.find((plugOption) => plugOption.plugItem.hash === maxReview.plugOptionHash);

  if (matchingPlugOption) {
    matchingPlugOption.bestRated = true;
  }
}

function getMaxReview(ratingsAndReviews: RatingAndReview[]) {
  const orderedRatingsAndReviews = _.sortBy(ratingsAndReviews, (ratingAndReview) => (ratingAndReview.ratingCount < 2 ? 0
    : ratingAndReview.averageReview)).reverse();

  if ((orderedRatingsAndReviews.length > 0) &&
      (orderedRatingsAndReviews[0].ratingCount > 1)) {
    return orderedRatingsAndReviews[0];
  }

  return null;
}

function getPlugRatingsAndReviewCount(
  plugOptionHash,
  reviews
): RatingAndReview {
  const matchingReviews = getMatchingReviews(plugOptionHash,
                                                    reviews);

  const ratingCount = matchingReviews.length;
  const averageReview = sum(matchingReviews, (r) => r.voted) / matchingReviews.length || 1;

  const ratingAndReview = {
    ratingCount,
    averageReview,
    plugOptionHash
  };

  return ratingAndReview;
}

function getMatchingReviews(
  plugOptionHash,
  reviews: DtrUserReview[]
) {
  return reviews.filter((review) => {
    return (review.selectedPerks && review.selectedPerks.includes(plugOptionHash)) ||
            (review.attachedMods && review.attachedMods.includes(plugOptionHash));
  });
}
