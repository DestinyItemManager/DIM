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
    if ((!item.reviews) ||
        (!item.reviews.length)) {
      return null;
    }

    const matchingReviews = this._getMatchingReviews(item);

    return matchingReviews.length;
  }

  _getMatchingReviews(item) {
    return _.filter(item.reviews, (review) => { return this._allSelectedPerksApply(item, review); });
  }

  _allSelectedPerksApply(item,
                         review) {
    const reviewSelectedPerks = this._getSelectedPerks(review);

    const availablePerks = item.roll.split(';');

    return _.every(reviewSelectedPerks, (reviewSelectedPerk) => { return _.contains(availablePerks, reviewSelectedPerk); });
  }

  _getSelectedPerks(review) {
    const allSelectedPerks = _.where(review.roll.split(';'), ((str) => { return str.indexOf('o') > -1; }));

    return allSelectedPerks;
  }
}

export { PerkRater };
