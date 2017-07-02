import template from './account-select.html';
import './account-select.scss';

export const AccountSelectComponent = {
  template,
  controller: AccountSelectController
};

function AccountSelectController($scope, dimPlatformService, dimState, loadingTracker) {
  'ngInject';

  const vm = this;

  vm.loadingTracker = loadingTracker;
  vm.platforms = [];

  vm.platformChange = function platformChange(platform) {
    loadingTracker.addPromise(dimPlatformService.setActive(platform));
  };

  $scope.$on('dim-platforms-updated', (e, args) => {
    vm.platforms = args.platforms;
  });

  $scope.$on('dim-active-platform-updated', (e, args) => {
    dimState.active = vm.currentPlatform = args.platform;
  });

  loadingTracker.addPromise(dimPlatformService.getPlatforms());
}