/**
 * A config function that will create the Destiny account route, which is the parent of
 * all views that care about a particular Destiny account.
 */
export function destinyAccountRoute($stateProvider) {
  'ngInject';

  $stateProvider.state({
    name: 'destiny-account',
    redirectTo: 'destiny2.inventory',
    url: '/:membershipId-{platformType:int}',
    resolve: {
      // TODO: move this to platform/account service
      account: ($transition$, dimPlatformService, $state) => {
        'ngInject';

        const { membershipId, platformType } = $transition$.params();

        // TODO: shouldn't need to load all platforms for this. How can we avoid that?
        return dimPlatformService.getPlatforms()
          .then(() => {
            // TODO: getPlatformMatching should be able to load an account that we don't know
            // TODO: make sure it's a "real" account
            const account = dimPlatformService.getPlatformMatching({
              membershipId,
              platformType
            });
            if (!account) {
              // If we didn't load an account, kick out and re-resolve
              $state.go('default-account');
              return undefined;
            }
            dimPlatformService.setActive(account);
            return account;
          });
      }
    }
  });
}