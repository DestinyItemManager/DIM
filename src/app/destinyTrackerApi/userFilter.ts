import { SyncService } from '../storage/sync.service';
import { D1ItemUserReview } from '../item-review/d1-dtr-api-types';
import { D2ItemUserReview } from '../item-review/d2-dtr-api-types';

/**
 * Note a problem user's membership ID so that we can ignore their reviews in the future.
 * Persists the list of ignored users across sessions.
 */
export async function ignoreUser(reportedMembershipId: string) {
  const ignoredUsers = await getIgnoredUsers();
  return SyncService.set({ ignoredUsers: [...ignoredUsers, reportedMembershipId] });
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
  return SyncService.set({ ignoredUsers: [] });
}

async function getIgnoredUsers() {
  const ignoredUsersKey = 'ignoredUsers';
  const data = await SyncService.get();
  return data[ignoredUsersKey] || [];
}
