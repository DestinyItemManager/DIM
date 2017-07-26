/**
 * Class to support registering (and remembering) displeasure with other reviewers.
 * 
 * @class UserFilter
 */
class UserFilter {
  constructor(syncService) {
    this._syncService = syncService;
  }

  _getIgnoredUsers() {
    const ignoredUsersKey = 'ignoredUsers';
    return this._syncService.get(ignoredUsersKey);
  }

  ignoreUser(membershipId) {
    const ignoredUsers = this._getIgnoredUsers();

    ignoredUsers.add(membershipId);

    const ignoredUsersKey = 'ignoredUsers';
    this._syncService.put({ ignoredUsersKey, ignoredUsers });
  }

  isUserIgnored(membershipId) {
    const ignoredUsers = this._getIgnoredUsers();

    return (ignoredUsers.indexOf(membershipId) !== -1);
  }
}

export { UserFilter };