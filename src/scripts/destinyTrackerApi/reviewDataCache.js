import _ from 'underscore';
import { gunTransformer } from './gunTransformer.js';

class reviewDataCache {
  constructor() {
    this._gunTransformer = new gunTransformer();
    this._itemStores = [];
  }

  getMatchingItem(item) {
    var dtrItem = this._gunTransformer.translateToDtrGun(item);

    dtrItem.referenceId = String(dtrItem.referenceId);

    return _.findWhere(this._itemStores, { referenceId: dtrItem.referenceId, roll: dtrItem.roll });
  }

  getRatingData(item) {
    var matchingItem = this.getMatchingItem(item);

    if (!matchingItem) {
      return null;
    }

    return matchingItem;
  }

  toAtMostOneDecimal(rating) {
    if (!rating) {
      return null;
    }

    if ((rating % 1) === 0) {
      return rating;
    }

    return rating.toFixed(1);
  }

  addScore(dtrRating) {
    dtrRating.rating = this.toAtMostOneDecimal(dtrRating.rating);

    this._itemStores.push(dtrRating);
  }

  addUserReviewData(item,
                    userReview) {
    var matchingItem = this.getMatchingItem(item);

    var rating = matchingItem.rating;

    Object.assign(matchingItem,
                  userReview);

    matchingItem.userRating = matchingItem.rating;

    matchingItem.rating = rating;
  }

  addReviewsData(item,
                 reviewsData) {
    var matchingItem = this.getMatchingItem(item);

    matchingItem.reviews = reviewsData.reviews;
    matchingItem.reviewsDataFetched = true;
  }

  getItemStores() {
    return this._itemStores;
  }

  eventuallyPurgeCachedData(item) {
    var tenMinutes = 1000 * 60 * 10;
    var self = this;

    setTimeout(function() {
      var matchingItem = self.getMatchingItem(item);

      matchingItem.reviews = null;
      matchingItem.reviewsDataFetched = false;
    },
      tenMinutes);
  }
}

export { reviewDataCache };