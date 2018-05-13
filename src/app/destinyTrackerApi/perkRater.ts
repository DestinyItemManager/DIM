import * as _ from 'underscore';
import { D1GridNode, D1Item } from '../inventory/item-types';
import { D1ItemUserReview } from '../item-review/d1-dtr-api-types';

interface RatingAndReview {
  ratingCount: number;
  averageReview: number;
  perkNode: D1GridNode;
}

/**
 * Rate perks on an item (based off of its attached user reviews).
 */
export class PerkRater {
  /**
   * Rate the perks on an item based off of its attached user reviews.
   */
  ratePerks(item: D1Item) {
    if ((!item.talentGrid) ||
        (!item.dtrRating) ||
        (!item.dtrRating.reviewsResponse) ||
        (!item.dtrRating.reviewsResponse.reviews.length)) {
      return;
    }

    const reviews = item.dtrRating.reviewsResponse.reviews;

    const maxColumn = this._getMaxColumn(item);

    if (!maxColumn) {
      return;
    }

    for (let i = 1; i < maxColumn; i++) {
      const perkNodesInColumn = this._getPerkNodesInColumn(item, i);

      const ratingsAndReviews = perkNodesInColumn.map((perkNode) => this._getPerkRatingsAndReviewCount(perkNode, reviews));

      const maxReview = this._getMaxReview(ratingsAndReviews);

      this._markNodeAsBest(maxReview);
    }
  }

  _markNodeAsBest(maxReview: RatingAndReview | null) {
    if (!maxReview) {
      return;
    }

    maxReview.perkNode.bestRated = true;
  }

  _getMaxReview(ratingsAndReviews: RatingAndReview[]) {
    const orderedRatingsAndReviews = ratingsAndReviews.sort((ratingAndReview) => ratingAndReview.ratingCount < 2 ? 0 : ratingAndReview.averageReview).reverse();

    if ((orderedRatingsAndReviews.length > 0) &&
        (orderedRatingsAndReviews[0].ratingCount > 1)) {
      return orderedRatingsAndReviews[0];
    }

    return null;
  }

  _getMaxColumn(item: D1Item): number | undefined {
    if (!item.talentGrid) {
      return undefined;
    }

    return _.max(item.talentGrid.nodes, (node) => node.column).column;
  }

  _getPerkNodesInColumn(item: D1Item,
                        column): D1GridNode[] {
    if (!item.talentGrid) {
      return [];
    }

    return _.where(item.talentGrid.nodes, { column });
  }

  _getPerkRatingsAndReviewCount(perkNode: D1GridNode,
                                reviews: D1ItemUserReview[]): RatingAndReview {
    const matchingReviews = this._getMatchingReviews(perkNode,
                                                     reviews);

    const ratingCount = matchingReviews.length;
    const averageReview = _.pluck(matchingReviews, 'rating').reduce((memo, num) => memo + num, 0) / matchingReviews.length || 1;

    const ratingAndReview = {
      ratingCount,
      averageReview,
      perkNode
    };

    return ratingAndReview;
  }

  _getMatchingReviews(perkNode: D1GridNode,
                      reviews: D1ItemUserReview[]): D1ItemUserReview[] {
    const perkRoll = perkNode.dtrRoll.replace('o', '');
    return reviews.filter((review) => this._selectedPerkNodeApplies(perkRoll, review));
  }

  _selectedPerkNodeApplies(perkRoll: string,
                           review: D1ItemUserReview): boolean {
    const reviewSelectedPerks = this._getSelectedPerks(review, perkRoll);

    return reviewSelectedPerks.some((reviewSelectedPerk) => perkRoll === reviewSelectedPerk);
  }

  _getSelectedPerks(review: D1ItemUserReview, perkRoll: string): string[] {
    const allSelectedPerks = (review.roll) ? review.roll.split(';').filter((str) => str.indexOf('o') > -1) : perkRoll; // in narrow cases, we can be supplied a D1ItemWorkingUserReview

    if (typeof allSelectedPerks === "string") {
      return [allSelectedPerks.replace('o', '')];
    }

    return allSelectedPerks.map((selectedPerk) => selectedPerk.replace('o', ''));
  }
}
