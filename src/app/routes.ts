import { DestinyAccount } from './accounts/destiny-account';

export const accountRoute = (account: DestinyAccount) =>
  `/${account.membershipId}/d${account.destinyVersion}`;

/**
 * A little helper that takes a path constructor and a suffix and returns a path constructor that
 * adds the suffix.
 */
function addPath<A extends any[]>(f: (...arg: A) => string, path: string): (...arg: A) => string {
  return (...arg) => f(...arg) + path;
}

// These have to already be declared or they can't be referenced later
const d1Route = (platformMembershipId: string) => `/${platformMembershipId}/d1`;
const d2Route = (platformMembershipId: string) => `/${platformMembershipId}/d2`;
const settingsRoute = () => '/settings';

/**
 * Route URL patterns that can be used anywhere to link to
 * specific pages. Path parameters are function arguments.
 * For nested routes, both the toplevel key and the children are callable.
 */
const routes = {
  about: () => '/about',
  privacy: () => '/privacy',
  whatsNew: () => '/whats-new',
  login: () => '/login',
  developer: () => '/developer',
  settings: Object.assign(settingsRoute, {
    gdriveRevisions: addPath(settingsRoute, '/gdrive-revisions'),
    auditLog: addPath(settingsRoute, '/audit')
  }),
  account: (account: DestinyAccount) => `/${account.membershipId}/d${account.destinyVersion}`,
  d1: Object.assign(d1Route, {
    inventory: addPath(d1Route, '/inventory'),
    recordBooks: addPath(d1Route, '/record-books'),
    activities: addPath(d1Route, '/activities'),
    loadoutBuilder: addPath(d1Route, '/optimizer'),
    vendors: addPath(d1Route, '/vendors')
  }),
  d2: Object.assign(d2Route, {
    inventory: addPath(d2Route, '/inventory'),
    progress: addPath(d2Route, '/progress'),
    collections: addPath(d2Route, '/collections'),
    loadoutBuilder: addPath(d2Route, '/optimizer'),
    organizer: addPath(d2Route, '/organizer'),
    vendors: addPath(d2Route, '/vendors'),
    singleVendor: (platformMembershipId: string, vendorId: string) =>
      d2Route(platformMembershipId) + `/vendors/${vendorId}`
  })
};

export default routes;
