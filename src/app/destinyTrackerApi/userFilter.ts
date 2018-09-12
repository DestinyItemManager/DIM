import { SyncService } from '../storage/sync.service';
import { D1ItemUserReview } from '../item-review/d1-dtr-api-types';
import { D2ItemUserReview } from '../item-review/d2-dtr-api-types';

/**
 * Note a problem user's membership ID so that we can ignore their reviews in the future.
 * Persists the list of ignored users across sessions.
 */
export function ignoreUser(reportedMembershipId: string) {
  return getIgnoredUsers().then((ignoredUsers) => {
    ignoredUsers.push(reportedMembershipId);
    return SyncService.set({ ignoredUsers });
  });
}

/**
 * Conditionally set the isIgnored flag on a review.
 * Sets it if the review was written by someone that's already on the ignore list.
 */
export function conditionallyIgnoreReviews(reviews: (D1ItemUserReview | D2ItemUserReview)[]) {
  return getIgnoredUsers().then((ignoredUsers) => {
    for (const review of reviews) {
      review.isIgnored = ignoredUsers.includes(review.reviewer.membershipId);
    }
  });
}

/**
 * Resets the list of ignored users.
 * This is in for development, but maybe someone else will eventually want?
 */
export function clearIgnoredUsers() {
  return SyncService.set({ ignoredUsers: [] });
}

function getIgnoredUsers() {
  const ignoredUsersKey = 'ignoredUsers';
  return SyncService.get().then((data) => data[ignoredUsersKey] || []);
}
