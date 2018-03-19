import * as _ from 'underscore';
import { DtrUserReview } from '../item-review/destiny-tracker.service';
import { DimItem, DimSocket } from '../inventory/store/d2-item-factory.service';
import { sum } from '../util';

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
  ratePerks(item: DimItem) {
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

        const ratingsAndReviews = plugOptionHashes.map((plugOptionHash) => this._getPlugRatingsAndReviewCount(plugOptionHash, item.reviews));

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
                                reviews): RatingAndReview {
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
                      reviews: DtrUserReview[]) {
    return reviews.filter((review) => {
      return (review.selectedPerks && review.selectedPerks.includes(plugOptionHash)) ||
             (review.attachedMods && review.attachedMods.includes(plugOptionHash));
    });
  }
}

export { D2PerkRater };
