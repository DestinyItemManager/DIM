import * as _ from 'lodash';
import { D1GridNode, D1Item } from '../inventory/item-types';
import { D1ItemUserReview } from '../item-review/d1-dtr-api-types';

interface RatingAndReview {
  ratingCount: number;
  averageReview: number;
  perkNode: D1GridNode;
}

/**
 * Rate the perks on an item based off of its attached user reviews.
 */
export function ratePerks(item: D1Item) {
  if (
    !item.talentGrid ||
    !item.dtrRating ||
    !item.dtrRating.reviewsResponse ||
    !item.dtrRating.reviewsResponse.reviews.length
  ) {
    return;
  }

  const reviews = item.dtrRating.reviewsResponse.reviews;

  const maxColumn = getMaxColumn(item);

  if (!maxColumn) {
    return;
  }

  for (let i = 1; i < maxColumn; i++) {
    const perkNodesInColumn = getPerkNodesInColumn(item, i);

    const ratingsAndReviews = perkNodesInColumn.map((perkNode) =>
      getPerkRatingsAndReviewCount(perkNode, reviews)
    );

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
  const orderedRatingsAndReviews = ratingsAndReviews
    .sort((ratingAndReview) =>
      ratingAndReview.ratingCount < 2 ? 0 : ratingAndReview.averageReview
    )
    .reverse();

  if (orderedRatingsAndReviews.length > 0 && orderedRatingsAndReviews[0].ratingCount > 1) {
    return orderedRatingsAndReviews[0];
  }

  return null;
}

function getMaxColumn(item: D1Item): number | undefined {
  if (!item.talentGrid) {
    return undefined;
  }

  return _.maxBy(item.talentGrid.nodes, (node) => node.column)!.column;
}

function getPerkNodesInColumn(item: D1Item, column): D1GridNode[] {
  if (!item.talentGrid) {
    return [];
  }

  return item.talentGrid.nodes.filter((n) => n.column === column);
}

function getPerkRatingsAndReviewCount(
  perkNode: D1GridNode,
  reviews: D1ItemUserReview[]
): RatingAndReview {
  const matchingReviews = getMatchingReviews(perkNode, reviews);

  const ratingCount = matchingReviews.length;
  const averageReview =
    matchingReviews.map((r) => r.rating).reduce((memo, num) => memo + num, 0) /
      matchingReviews.length || 1;

  const ratingAndReview = {
    ratingCount,
    averageReview,
    perkNode
  };

  return ratingAndReview;
}

function getMatchingReviews(perkNode: D1GridNode, reviews: D1ItemUserReview[]): D1ItemUserReview[] {
  const perkRoll = perkNode.dtrRoll.replace('o', '');
  return reviews.filter((review) => selectedPerkNodeApplies(perkRoll, review));
}

function selectedPerkNodeApplies(perkRoll: string, review: D1ItemUserReview): boolean {
  const reviewSelectedPerks = getSelectedPerks(review, perkRoll);

  return reviewSelectedPerks.some((reviewSelectedPerk) => perkRoll === reviewSelectedPerk);
}

function getSelectedPerks(review: D1ItemUserReview, perkRoll: string): string[] {
  const allSelectedPerks = review.roll
    ? review.roll.split(';').filter((str) => str.indexOf('o') > -1)
    : perkRoll; // in narrow cases, we can be supplied a D1ItemWorkingUserReview

  if (typeof allSelectedPerks === 'string') {
    return [allSelectedPerks.replace('o', '')];
  }

  return allSelectedPerks.map((selectedPerk) => selectedPerk.replace('o', ''));
}
