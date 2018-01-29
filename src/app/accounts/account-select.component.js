import dialogTemplate from './account-select.dialog.html';
import template from './account-select.html';
import './account-select.scss';

export const AccountSelectComponent = {
  template,
  controller: AccountSelectController,
  bindings: {
    currentAccount: '<'
  }
};

function AccountSelectController($scope, dimPlatformService, dimSettingsService, loadingTracker, ngDialog, OAuthTokenService, $state) {
  'ngInject';

  const vm = this;
  let dialogResult = null;

  vm.loadingTracker = loadingTracker;
  vm.accounts = [];

  vm.$onInit = () => {
    const loadAccountsPromise = dimPlatformService.getPlatforms()
      .then((accounts) => {
        vm.accounts = accounts;
      });
    loadingTracker.addPromise(loadAccountsPromise);
  };

  vm.logOut = function(e) {
    e.stopPropagation();

    OAuthTokenService.removeToken();
    $state.go('login', { reauth: true });
  };

  vm.selectAccount = function(e, account) {
    e.stopPropagation();
    $state.go(account.destinyVersion === 1 ? 'destiny1' : 'destiny2', account);
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
          // TODO: reorder accounts by LRU?
          this.accounts = vm.accounts.filter((p) => {
            return p.membershipId !== vm.currentAccount.membershipId ||
            p.platformType !== vm.currentAccount.platformType ||
            p.destinyVersion !== vm.destinyVersion;
          });
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
