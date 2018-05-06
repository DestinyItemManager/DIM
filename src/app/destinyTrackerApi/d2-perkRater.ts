import * as _ from 'underscore';
import { sum } from '../util';
import { D2Item, DimSocket } from '../inventory/item-types';
import { D2ItemUserReview } from '../item-review/d2-dtr-api-types';

export interface RatingAndReview {
  ratingCount: number;
  averageReview: number;
  plugOptionHash: number;
}

/**
 * Rate perks on a Destiny 2 item (based off of its attached user reviews).
 */
class D2PerkRater {
  /**
   * Rate the perks on a Destiny 2 item based off of its attached user reviews.
   */
  ratePerks(item: D2Item) {
    if (!item.ratingData ||
        !item.ratingData.reviewsResponse ||
        !item.ratingData.reviewsResponse.reviews.length ||
        !item.sockets ||
        !item.sockets.sockets) {
      return;
    }

    const itemReviews = item.ratingData.reviewsResponse.reviews;

    item.sockets.sockets.forEach((socket) => {
      if ((socket.plugOptions.length) &&
          (socket.plugOptions.length > 1)) {
        const plugOptionHashes = socket.plugOptions.map((i) => i.plugItem.hash);

        const ratingsAndReviews = plugOptionHashes.map((plugOptionHash) =>
          this._getPlugRatingsAndReviewCount(plugOptionHash, itemReviews));

        const maxReview = this._getMaxReview(ratingsAndReviews);

        this._markPlugAsBest(maxReview, socket);
      }
    });
  }

  _markPlugAsBest(maxReview: RatingAndReview | null,
                  socket: DimSocket) {
    if (!maxReview) {
      return;
    }

    const matchingPlugOption = socket.plugOptions.find((plugOption) => plugOption.plugItem.hash === maxReview.plugOptionHash);

    if (matchingPlugOption) {
      matchingPlugOption.bestRated = true;
    }
  }

  _getMaxReview(ratingsAndReviews: RatingAndReview[]) {
    const orderedRatingsAndReviews = _.sortBy(ratingsAndReviews, (ratingAndReview) => (ratingAndReview.ratingCount < 2 ? 0
      : ratingAndReview.averageReview)).reverse();

    if ((orderedRatingsAndReviews.length > 0) &&
        (orderedRatingsAndReviews[0].ratingCount > 1)) {
      return orderedRatingsAndReviews[0];
    }

    return null;
  }

  _getPlugRatingsAndReviewCount(plugOptionHash,
                                reviews: D2ItemUserReview[]): RatingAndReview {
    const matchingReviews = this._getMatchingReviews(plugOptionHash,
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

  _getMatchingReviews(plugOptionHash,
                      reviews: D2ItemUserReview[]) {
    return reviews.filter((review) => {
      return (review.selectedPerks && review.selectedPerks.includes(plugOptionHash)) ||
             (review.attachedMods && review.attachedMods.includes(plugOptionHash));
    });
  }
}

export { D2PerkRater };
