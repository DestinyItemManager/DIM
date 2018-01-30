/**
 * A config function that will create the default account route, which is used to redirect
 * when we don't know what to do.
 */
export function defaultAccountRoute($stateProvider) {
  'ngInject';

  // A dummy state that'll redirect to the selected character's Destiny 1 inventory
  $stateProvider.state({
    name: 'default-account',
    resolve: {
      activeAccount: (dimPlatformService) => {
        'ngInject';
        return dimPlatformService.getPlatforms().then(() => dimPlatformService.getActive());
      }
    },
    controller: function controller($state, activeAccount) {
      'ngInject';

      if (activeAccount) {
        $state.go(`destiny${activeAccount.destinyVersion}.inventory`, activeAccount);
      } else {
        // A bit awkward, but getPlatforms should already have redirected to login
      }
    }
  });
}
