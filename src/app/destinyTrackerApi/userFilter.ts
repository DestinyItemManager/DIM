import { D1ItemUserReview } from '../item-review/d1-dtr-api-types';
import { D2ItemUserReview } from '../item-review/d2-dtr-api-types';

/**
 * Note a problem user's membership ID so that we can ignore their reviews in the future.
 * Persists the list of ignored users across sessions.
 */
export async function ignoreUser(_reportedMembershipId: string) {
  // bugbug: this should dispatch a reprocessing of fetched reviews
  // todo: reimplement
}

/**
 * Conditionally set the isIgnored flag on a review.
 * Sets it if the review was written by someone that's already on the ignore list.
 */
export async function conditionallyIgnoreReviews(reviews: (D1ItemUserReview | D2ItemUserReview)[]) {
  const ignoredUsers = await getIgnoredUsers();
  for (const review of reviews) {
    review.isIgnored = ignoredUsers.includes(review.reviewer.membershipId);
  }
}

/**
 * Resets the list of ignored users.
 * This is in for development, but maybe someone else will eventually want?
 */
export function clearIgnoredUsers() {
  // TODO: reimplement this
}

export async function getIgnoredUsers(): Promise<string[]> {
  // TODO: reimplement this
  return [];
}
