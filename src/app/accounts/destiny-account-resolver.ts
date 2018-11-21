import { getPlatforms, setActivePlatform, getPlatformMatching } from './platform.service';
import { Transition } from '@uirouter/react';

/**
 * This is a function that generates a resolver that can be used for both the destiny1 and destiny2
 * routes to resolve an account specific to their version.
 */
export function destinyAccountResolver(destinyVersion: 1 | 2) {
  return async ($transition$: Transition) => {
    'ngInject';

    const { membershipId, platformType } = $transition$.params();

    // TODO: shouldn't need to load all platforms for this. How can we avoid that?
    await getPlatforms();
    // TODO: getPlatformMatching should be able to load an account that we don't know
    // TODO: make sure it's a "real" account
    const account = getPlatformMatching({
      membershipId,
      platformType,
      destinyVersion
    });
    if (!account) {
      // If we didn't load an account, kick out and re-resolve
      $transition$.router.stateService.go('default-account');
      return null;
    }
    return setActivePlatform(account);
  };
}
