import _ from 'underscore';

/**
 * Rate perks on an item (based off of its attached user reviews).
 *
 * @class PerkRater
 */
class PerkRater {
  /**
   * Rate the perks on an item based off of its attached user reviews.
   *
   * @param {any} item
   * @memberof PerkRater
   */
  ratePerks(item) {
    if ((!item.talentGrid) ||
        (!item.reviews) ||
        (!item.reviews.length)) {
      return;
    }

    const maxColumn = this._getMaxColumn(item);

    for (let i = 1; i < maxColumn; i++) {
      const perkNodesInColumn = this._getPerkNodesInColumn(item, i);

      const ratingsAndReviews = perkNodesInColumn.map((perkNode) => this._getPerkRatingsAndReviewCount(perkNode, item.reviews));

      const maxReview = this._getMaxReview(ratingsAndReviews);

      this._markNodeAsBest(maxReview);
    }
  }

  _markNodeAsBest(maxReview) {
    if (!maxReview) {
      return;
    }

    maxReview.perkNode.bestRated = true;
  }

  _getMaxReview(ratingsAndReviews) {
    const orderedRatingsAndReviews = _.sortBy(ratingsAndReviews, (ratingAndReview) => { return ratingAndReview.ratingCount < 2 ? 0 : ratingAndReview.averageReview; }).reverse();

    if ((orderedRatingsAndReviews.length > 0) &&
        (orderedRatingsAndReviews[0].ratingCount > 1)) {
      return orderedRatingsAndReviews[0];
    }

    return null;
  }

  _getMaxColumn(item) {
    return _.max(item.talentGrid.nodes, (node) => { return node.column; }).column;
  }

  _getPerkNodesInColumn(item,
                        column) {
    return _.where(item.talentGrid.nodes, { column: column });
  }

  _getPerkRatingsAndReviewCount(perkNode,
                                reviews) {
    const matchingReviews = this._getMatchingReviews(perkNode,
                                                     reviews);

    const ratingCount = matchingReviews.length;
    const averageReview = _.pluck(matchingReviews, 'rating').reduce((memo, num) => memo + num, 0) / matchingReviews.length || 1;

    const ratingAndReview = {
      ratingCount: ratingCount,
      averageReview: averageReview,
      perkNode: perkNode
    };

    return ratingAndReview;
  }

  _getSelectedPerksAndRating(review) {
    const selectedPerks = this._getSelectedPerks(review);

    return {
      selectedPerks: selectedPerks,
      rating: review.rating,
      isHighlighted: review.isHighlighted
    };
  }

  _getMatchingReviews(perkNode,
                      reviews) {
    const perkRoll = perkNode.dtrRoll.replace('o', '');
    return reviews.filter((review) => this._selectedPerkNodeApplies(perkRoll, review));
  }

  _selectedPerkNodeApplies(perkRoll,
                           review) {
    const reviewSelectedPerks = this._getSelectedPerks(review);
    return reviewSelectedPerks.some((reviewSelectedPerk) => perkRoll === reviewSelectedPerk);
  }

  _getSelectedPerks(review) {
    const allSelectedPerks = review.roll.split(';').filter((str) => str.indexOf('o') > -1);
    return allSelectedPerks.map((selectedPerk) => selectedPerk.replace('o', ''));
  }
}

export { PerkRater };
