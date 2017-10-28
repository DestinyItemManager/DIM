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
        (!item.writtenReviews.length)) {
      return;
    }

    console.log(item);

    // const maxColumn = this._getMaxColumn(item);

    // for (let i = 1; i < maxColumn; i++) {
    //   const perkNodesInColumn = this._getPerkNodesInColumn(item, i);

    //   const ratingsAndReviews = _.map(perkNodesInColumn, (perkNode) => this._getPerkRatingsAndReviewCount(perkNode, item.writtenReviews));

    //   const maxReview = this._getMaxReview(ratingsAndReviews);

    //   this._markNodeAsBest(maxReview);
    // }
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
    return _.filter(reviews, (review) => { return this._selectedPerkNodeApplies(perkRoll, review); });
  }

  _selectedPerkNodeApplies(perkRoll,
                           review) {
    const reviewSelectedPerks = this._getSelectedPerks(review);

    return _.some(reviewSelectedPerks, (reviewSelectedPerk) => { return perkRoll === reviewSelectedPerk; });
  }

  _getSelectedPerks(review) {
    const allSelectedPerks = _.filter(review.roll.split(';'), ((str) => { return str.indexOf('o') > -1; }));

    return _.map(allSelectedPerks, (selectedPerk) => { return selectedPerk.replace('o', ''); });
  }
}

export { D2PerkRater };
