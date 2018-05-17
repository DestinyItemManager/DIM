import { SyncService } from "../storage/sync.service";

/**
 * Note a problem user's membership ID so that we can ignore their reviews in the future.
 * Persists the list of ignored users across sessions.
 */
export function ignoreUser(reportedMembershipId) {
  getIgnoredUsers()
    .then((ignoredUsers) => {
      ignoredUsers.push(reportedMembershipId);

      SyncService.set({ ignoredUsers });
    });
}

/**
 * Conditionally set the isIgnored flag on a review.
 * Sets it if the review was written by someone that's already on the ignore list.
 */
export function conditionallyIgnoreReview(review) {
  const membershipId = review.reviewer.membershipId;

  getIgnoredUsers()
    .then((ignoredUsers) => {
      review.isIgnored = (ignoredUsers.indexOf(membershipId) !== -1);
    });
}

/**
 * Resets the list of ignored users.
 * This is in for development, but maybe someone else will eventually want?
 */
export function clearIgnoredUsers() {
  SyncService.set({ ignoredUsers: [] });
}

function getIgnoredUsers() {
  const ignoredUsersKey = 'ignoredUsers';
  return SyncService.get()
    .then((data) => {
      return data[ignoredUsersKey] || [];
    });
}
