import * as _ from 'underscore';
import { D1ItemUserReview } from '../item-review/destiny-tracker.service';
import { D1GridNode, D1Item } from '../inventory/item-types';

interface RatingAndReview {
  ratingCount: number;
  averageReview: number;
  perkNode: D1GridNode;
}

/**
 * Rate the perks on an item based off of its attached user reviews.
 */
export function ratePerks(item: D1Item) {
  if ((!item.talentGrid) ||
      (!item.reviews) ||
      (!item.reviews.length)) {
    return;
  }

  const maxColumn = getMaxColumn(item);

  if (!maxColumn) {
    return;
  }

  for (let i = 1; i < maxColumn; i++) {
    const perkNodesInColumn = getPerkNodesInColumn(item, i);

    const ratingsAndReviews = perkNodesInColumn.map((perkNode) => getPerkRatingsAndReviewCount(perkNode, item.reviews as D1ItemUserReview[]));

    const maxReview = getMaxReview(ratingsAndReviews);

    markNodeAsBest(maxReview);
  }
}

function markNodeAsBest(maxReview: RatingAndReview | null) {
  if (!maxReview) {
    return;
  }

  maxReview.perkNode.bestRated = true;
}

function getMaxReview(ratingsAndReviews: RatingAndReview[]) {
  const orderedRatingsAndReviews = ratingsAndReviews.sort((ratingAndReview) => ratingAndReview.ratingCount < 2 ? 0 : ratingAndReview.averageReview).reverse();

  if ((orderedRatingsAndReviews.length > 0) &&
      (orderedRatingsAndReviews[0].ratingCount > 1)) {
    return orderedRatingsAndReviews[0];
  }

  return null;
}

function getMaxColumn(item: D1Item): number | undefined {
  if (!item.talentGrid) {
    return undefined;
  }

  return _.max(item.talentGrid.nodes, (node) => node.column).column;
}

function getPerkNodesInColumn(
  item: D1Item,
  column
): D1GridNode[] {
  if (!item.talentGrid) {
    return [];
  }

  return _.where(item.talentGrid.nodes, { column });
}

function getPerkRatingsAndReviewCount(
  perkNode: D1GridNode,
  reviews: D1ItemUserReview[]
): RatingAndReview {
  const matchingReviews = getMatchingReviews(perkNode,
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

function getMatchingReviews(
  perkNode: D1GridNode,
  reviews: D1ItemUserReview[]
) {
  const perkRoll = perkNode.dtrRoll.replace('o', '');
  return reviews.filter((review) => selectedPerkNodeApplies(perkRoll, review));
}

function selectedPerkNodeApplies(
  perkRoll,
  review
) {
  const reviewSelectedPerks = getSelectedPerks(review, perkRoll);
  return reviewSelectedPerks.some((reviewSelectedPerk) => perkRoll === reviewSelectedPerk);
}

function getSelectedPerks(review, perkRoll) {
  const allSelectedPerks = (review.roll) ? review.roll.split(';').filter((str) => str.indexOf('o') > -1) : perkRoll; // in narrow cases, we can be supplied a D1ItemWorkingUserReview
  return allSelectedPerks.map((selectedPerk) => selectedPerk.replace('o', ''));
}
