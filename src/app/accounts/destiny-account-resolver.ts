import { getPlatforms, setActivePlatform } from './platform.service';
import { Transition } from '@uirouter/react';
import store from 'app/store/store';
import { accountsSelector } from './reducer';

/**
 * This is a function that generates a resolver that can be used for both the destiny1 and destiny2
 * routes to resolve an account specific to their version.
 */
export function destinyAccountResolver(destinyVersion: 1 | 2) {
  return async ($transition$: Transition) => {
    const { membershipId } = $transition$.params();

    await getPlatforms();
    // TODO: getPlatformMatching should be able to load an account that we don't know
    const account = accountsSelector(store.getState()).find(
      (account) =>
        account.membershipId === membershipId && account.destinyVersion === destinyVersion
    );
    if (!account) {
      // If we didn't load an account, kick out and re-resolve
      $transition$.router.stateService.go('default-account');
      return null;
    }
    return setActivePlatform(account);
  };
}
