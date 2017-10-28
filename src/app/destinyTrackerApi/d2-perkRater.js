import _ from 'underscore';

/**
 * Rate perks on a Destiny 2 item (based off of its attached user reviews).
 *
 * @class D2PerkRater
 */
class D2PerkRater {
  /**
   * Rate the perks on a Destiny 2 item based off of its attached user reviews.
   *
   * @param {any} item
   * @memberof D2PerkRater
   */
  ratePerks(item) {
    if ((!item.writtenReviews) ||
        (!item.writtenReviews.length) ||
        (!item.sockets) ||
        (!item.sockets.sockets)) {
      return;
    }

    _.each(item.sockets.sockets, (socket) => {
      if ((socket.plugOptions.length) &&
          (socket.plugOptions.length > 1)) {
        const plugOptionHashes = _.pluck(socket.plugOptions, 'hash');

        const ratingsAndReviews = _.map(plugOptionHashes, (plugOptionHash) => this._getPlugRatingsAndReviewCount(plugOptionHash, item.writtenReviews));

        const maxReview = this._getMaxReview(ratingsAndReviews);

        this._markPlugAsBest(maxReview,
                             socket);
      }
    });
  }

  _markPlugAsBest(maxReview,
                  socket) {
    if (!maxReview) {
      return;
    }

    const matchingPlugOption = _.find(socket.plugOptions, (plugOption) => plugOption.hash === maxReview.plugOptionHash);

    if (matchingPlugOption) {
      matchingPlugOption.bestRated = true;
    }
  }

  _getMaxReview(ratingsAndReviews) {
    const orderedRatingsAndReviews = _.sortBy(ratingsAndReviews, (ratingAndReview) => { return ratingAndReview.ratingCount < 2 ? 0 : ratingAndReview.averageReview; }).reverse();

    if ((orderedRatingsAndReviews.length > 0) &&
        (orderedRatingsAndReviews[0].ratingCount > 1)) {
      return orderedRatingsAndReviews[0];
    }

    return null;
  }

  _getPlugRatingsAndReviewCount(plugOptionHash,
                                reviews) {
    const matchingReviews = this._getMatchingReviews(plugOptionHash,
                                                     reviews);

    const ratingCount = matchingReviews.length;
    const averageReview = _.pluck(matchingReviews, 'rating').reduce((memo, num) => memo + num, 0) / matchingReviews.length || 1;

    const ratingAndReview = {
      ratingCount: ratingCount,
      averageReview: averageReview,
      plugOptionHash: plugOptionHash
    };

    return ratingAndReview;
  }

  _getMatchingReviews(plugOptionHash,
                      reviews) {
    return _.filter(reviews, (review) => { return review.selectedPerks.includes(plugOptionHash) ||
                                                  ((review.attachedMods) &&
                                                   (review.attachedMods.includes(plugOptionHash))); });
  }
}

export { D2PerkRater };
