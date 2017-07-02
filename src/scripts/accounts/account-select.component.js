import template from './account-select.html';
import dialogTemplate from './account-select.dialog.html';
import './account-select.scss';

export const AccountSelectComponent = {
  template,
  controller: AccountSelectController
};

function AccountSelectController($scope, dimPlatformService, dimState, loadingTracker, ngDialog, OAuthTokenService, $state) {
  'ngInject';

  const vm = this;
  let dialogResult = null;

  // TODO: s/platform/account

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

  vm.logOut = function(e) {
    e.stopPropagation();

    OAuthTokenService.removeToken();
    $state.go('login', { reauth: true });
  };

  vm.selectPlatform = function(e, platform) {
    e.stopPropagation();
    // dimPlatformService.setActive(platform);
    $state.go('inventory', {
      destinyMembershipId: platform.membershipId,
      platformType: platform.platformType
    });
  };

  vm.openDropdown = function(e) {
    e.stopPropagation();

    if (dialogResult === null) {
      ngDialog.closeAll();

      dialogResult = ngDialog.open({
        template: dialogTemplate,
        appendTo: `account-select`,
        overlay: false,
        className: 'accounts-popup',
        showClose: false,
        controllerAs: '$ctrl',
        controller: function($scope) {
          'ngInject';
          this.platforms = vm.platforms.filter((p) => p.membershipId !== vm.currentPlatform.membershipId || p.platformType !== vm.currentPlatform.platformType);
          this.selectPlatform = (e, platform) => {
            $scope.closeThisDialog(); // eslint-disable-line angular/controller-as
            vm.selectPlatform(e, platform);
          };
          this.logOut = (e) => {
            $scope.closeThisDialog(); // eslint-disable-line angular/controller-as
            vm.logOut(e);
          };
        }
      });

      dialogResult.closePromise.then(() => {
        dialogResult = null;
      });
    } else {
      dialogResult.close();
    }
  };
}