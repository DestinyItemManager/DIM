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

  ignoreUser(reportedMembershipId) {
    this._getIgnoredUsersPromise()
      .then((ignoredUsers) => {
        ignoredUsers.push(reportedMembershipId);

        this._syncService.set({ ignoredUsers: ignoredUsers });
      });
  }

  conditionallyIgnoreReview(review) {
    const membershipId = review.reviewer.membershipId;

    this._getIgnoredUsersPromise()
      .then((ignoredUsers) => {
        review.isIgnored = (ignoredUsers.indexOf(membershipId) !== -1);
      });
  }
}

export { UserFilter };