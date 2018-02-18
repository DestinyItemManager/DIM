import { getPlatforms, setActivePlatform, getPlatformMatching } from '../accounts/platform.service';

/**
 * A config function that will create the Destiny account route, which is the parent of
 * all views that care about a particular Destiny account.
 */
export function destinyAccountRoute($stateProvider) {
  'ngInject';

  $stateProvider.state({
    name: 'destiny-account',
    redirectTo: 'destiny2.inventory',
    url: '/:membershipId-{platformType:int}'
  });

  // Register a lazy future state for all Destiny 1 pages, so they are not in the main chunk.
  $stateProvider.state({
    name: 'destiny1.**',
    parent: 'destiny-account',
    lazyLoad($transition$) {
      const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');
      return import(/* webpackChunkName: "destiny1" */ '../destiny1/destiny1.module.js')
        .then((mod) => $ocLazyLoad.load(mod.default));
    }
  });
}

/**
 * This is a function that generates a resolver that can be used for both the destiny1 and destiny2
 * routes to resolve an account specific to their version.
 */
export function destinyAccountResolver(destinyVersion) {
  return ($transition$, $state) => {
    'ngInject';

    const { membershipId, platformType } = $transition$.params();

    // TODO: shouldn't need to load all platforms for this. How can we avoid that?
    return getPlatforms()
      .then(() => {
        // TODO: getPlatformMatching should be able to load an account that we don't know
        // TODO: make sure it's a "real" account
        const account = getPlatformMatching({
          membershipId,
          platformType,
          destinyVersion
        });
        if (!account) {
          // If we didn't load an account, kick out and re-resolve
          $state.go('default-account');
          return undefined;
        }
        return setActivePlatform(account);
      });
  };
}