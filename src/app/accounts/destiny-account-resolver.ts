import { getPlatforms, setActivePlatform } from './platforms';
import { Transition } from '@uirouter/react';
import store from 'app/store/store';
import { DestinyAccount } from './destiny-account';

/**
 * This is a function that generates a resolver that can be used for both the destiny1 and destiny2
 * routes to resolve an account specific to their version.
 */
export function destinyAccountResolver(destinyVersion: 1 | 2) {
  return async ($transition$: Transition) => {
    const { membershipId } = $transition$.params();

    const accounts = await ((store.dispatch(getPlatforms()) as any) as Promise<
      readonly DestinyAccount[]
    >);
    // TODO: getPlatformMatching should be able to load an account that we don't know
    const account = accounts.find(
      (account) =>
        account.membershipId === membershipId && account.destinyVersion === destinyVersion
    );
    if (!account) {
      // If we didn't load an account, kick out and re-resolve
      $transition$.router.stateService.go('default-account');
      return null;
    }
    return store.dispatch(setActivePlatform(account));
  };
}
