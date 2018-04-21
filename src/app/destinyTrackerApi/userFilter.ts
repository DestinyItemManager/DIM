import { SyncService } from "../storage/sync.service";

/**
 * Class to support registering (and remembering) displeasure with other reviewers.
 */
export class UserFilter {
  _getIgnoredUsersPromise() {
    const ignoredUsersKey = 'ignoredUsers';
    return SyncService.get()
      .then((data) => {
        return data[ignoredUsersKey] || [];
      });
  }

  /**
   * Note a problem user's membership ID so that we can ignore their reviews in the future.
   * Persists the list of ignored users across sessions.
   */
  ignoreUser(reportedMembershipId) {
    this._getIgnoredUsersPromise()
      .then((ignoredUsers) => {
        ignoredUsers.push(reportedMembershipId);

        SyncService.set({ ignoredUsers });
      });
  }

  /**
   * Conditionally set the isIgnored flag on a review.
   * Sets it if the review was written by someone that's already on the ignore list.
   */
  conditionallyIgnoreReview(review) {
    const membershipId = review.reviewer.membershipId;

    this._getIgnoredUsersPromise()
      .then((ignoredUsers) => {
        review.isIgnored = (ignoredUsers.indexOf(membershipId) !== -1);
      });
  }

  /**
   * Resets the list of ignored users.
   * This is in for development, but maybe someone else will eventually want?
   */
  clearIgnoredUsers() {
    SyncService.set({ ignoredUsers: [] });
  }
}
