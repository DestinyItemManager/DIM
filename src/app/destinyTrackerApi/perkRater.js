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
    console.log(item);

    if ((!item.writtenReviews) ||
        (!item.writtenReviews.length)) {
      return null;
    }

    const selectedPerksAndRatings = _.map(item.writtenReviews, (review) => { this._getSelectedPerksAndRating(review); });

    const maxColumn = this._getMaxColumn(item);

    for (let i = 1; i < maxColumn; i++) {
      const perkNodesInColumn = this._getPerkNodesInColumn(item, i);

      _.each(perkNodesInColumn, (perkNode) => this._getPerkRatingsAndReviewCount(perkNode, item.writtenReviews));
    }

    //console.log(selectedPerksAndRatings);

    const availablePerks = item.talentGrid.dtrRoll.replace('o', '').split(';');

    _.each(availablePerks, (availablePerk) => { this._getPerkRatingsAndReviewCount(availablePerk, item.reviews); });

    const matchingReviews = this._getMatchingReviews(item);

    return matchingReviews.length;
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

    //console.log(reviews.length, matchingReviews.length);

    //console.log(matchingReviews);

    const ratingCount = matchingReviews.length;
    const averageReview = matchingReviews.reduce((memo, num) => memo + num, 0) / matchingReviews.length || 1;

    const ratingAndReview = {
      ratingCount: ratingCount,
      averageReview: averageReview
    };

    //console.log(perkNode, ratingAndReview);

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

    console.log(reviewSelectedPerks);
    console.log(perkRoll);
    console.log(_.some(reviewSelectedPerks, (reviewSelectedPerk) => { return perkRoll === reviewSelectedPerk; }));
    console.log(_.some(reviewSelectedPerks, (reviewSelectedPerk) => { return perkRoll == reviewSelectedPerk; }));

    return _.some(reviewSelectedPerks, (reviewSelectedPerk) => { return perkRoll === reviewSelectedPerk; });
  }

  _getSelectedPerks(review) {
    console.log(review.roll.split(';'));
    const allSelectedPerks = _.filter(review.roll.split(';'), ((str) => { return str.indexOf('o') > -1; }));
    console.log(allSelectedPerks);

    return _.map(allSelectedPerks, (selectedPerk) => { return selectedPerk.replace('o', ''); });
  }
}

export { PerkRater };
