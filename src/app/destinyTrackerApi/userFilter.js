/**
 * Class to support registering (and remembering) displeasure with other reviewers.
 *
 * @class UserFilter
 */
class UserFilter {
  constructor(syncService) {
    this._syncService = syncService;
  }

  _getIgnoredUsersPromise() {
    const ignoredUsersKey = 'ignoredUsers';
    return this._syncService.get()
      .then((data) => {
        return data[ignoredUsersKey] || [];
      });
  }

  /**
   * Note a problem user's membership ID so that we can ignore their reviews in the future.
   * Persists the list of ignored users across sessions.
   *
   * @param {any} reportedMembershipId
   * @memberof UserFilter
   */
  ignoreUser(reportedMembershipId) {
    this._getIgnoredUsersPromise()
      .then((ignoredUsers) => {
        ignoredUsers.push(reportedMembershipId);

        this._syncService.set({ ignoredUsers: ignoredUsers });
      });
  }

  /**
   * Conditionally set the isIgnored flag on a review.
   * Sets it if the review was written by someone that's already on the ignore list.
   *
   * @param {any} review
   * @memberof UserFilter
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
   *
   * @memberof UserFilter
   */
  clearIgnoredUsers() {
    this._syncService.set({ ignoredUsers: [] });
  }
}

export { UserFilter };