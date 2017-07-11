import template from './account-select.html';
import dialogTemplate from './account-select.dialog.html';
import './account-select.scss';

export const AccountSelectComponent = {
  template,
  controller: AccountSelectController
};

function AccountSelectController($scope, dimPlatformService, loadingTracker, ngDialog, OAuthTokenService, $state) {
  'ngInject';

  const vm = this;
  let dialogResult = null;

  vm.loadingTracker = loadingTracker;
  vm.accounts = [];

  vm.accountChange = function accountChange(account) {
    loadingTracker.addPromise(dimPlatformService.setActive(account));
  };

  $scope.$on('dim-platforms-updated', (e, args) => {
    vm.accounts = args.platforms;
  });

  $scope.$on('dim-active-platform-updated', (e, args) => {
    vm.currentAccount = args.platform;
  });

  const loadAccountsPromise = dimPlatformService.getPlatforms()
    .then((accounts) => {
      vm.accounts = accounts;
      vm.currentAccount = dimPlatformService.getActive();
    });
  loadingTracker.addPromise(loadAccountsPromise);

  vm.logOut = function(e) {
    e.stopPropagation();

    OAuthTokenService.removeToken();
    $state.go('login', { reauth: true });
  };

  vm.selectAccount = function(e, account) {
    e.stopPropagation();
    $state.go('inventory', account);
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
          this.accounts = vm.accounts.filter((p) => p.membershipId !== vm.currentAccount.membershipId || p.platformType !== vm.currentAccount.platformType);
          this.selectAccount = (e, account) => {
            $scope.closeThisDialog(); // eslint-disable-line angular/controller-as
            vm.selectAccount(e, account);
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
