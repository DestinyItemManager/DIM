import { getPlatforms, setActivePlatform, getPlatformMatching } from '../accounts/platform.service';
import { UIView, Transition } from '@uirouter/react';

// TODO: this state probably isn't necessary
export const destinyAccountState = {
  name: 'destiny-account',
  redirectTo: 'destiny2.inventory',
  url: '/:membershipId-{platformType:int}',
  // An empty component with a UIView is needed
  component: UIView
};

/**
 * This is a function that generates a resolver that can be used for both the destiny1 and destiny2
 * routes to resolve an account specific to their version.
 */
export function destinyAccountResolver(destinyVersion: 1 | 2) {
  return ($transition$: Transition) => {
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
          $transition$.router.stateService.go('default-account');
          return undefined;
        }
        return setActivePlatform(account);
      });
  };
}
