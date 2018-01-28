import template from './account-select.html';
import dialogTemplate from './account-select.dialog.html';
import './account-select.scss';

export const AccountSelectComponent = {
  template,
  controller: AccountSelectController,
  bindings: {
    destinyVersion: '<'
  }
};

function AccountSelectController($scope, dimPlatformService, dimSettingsService, loadingTracker, ngDialog, OAuthTokenService, $state) {
  'ngInject';

  const vm = this;
  let dialogResult = null;

  vm.loadingTracker = loadingTracker;
  vm.accounts = [];

  vm.$onChanges = function(changes) {
    // If we go to a non-destiny-account page, leave it, or default to D1
    vm.destinyVersion = changes.destinyVersion.currentValue ||
      vm.destinyVersion ||
      (vm.currentAccount && vm.currentAccount.destinyVersion) ||
      1;

    // TODO: remove
    dimSettingsService.destinyVersion = vm.destinyVersion;
    dimSettingsService.save();
  };

  // TODO: save this in the account service, or some other global state, so we don't flip flop
  function setCurrentAccount(currentAccount) {
    vm.currentAccount = currentAccount;
  }

  vm.accountChange = function accountChange(account) {
    loadingTracker.addPromise(dimPlatformService.setActive(account).then(setCurrentAccount));
  };

  const loadAccountsPromise = dimPlatformService.getPlatforms()
    .then((accounts) => {
      vm.accounts = accounts;
      setCurrentAccount(dimPlatformService.getActive());
    });
  loadingTracker.addPromise(loadAccountsPromise);

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
