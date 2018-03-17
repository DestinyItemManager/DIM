import { StateService } from '@uirouter/angularjs';
import { IDialogOpenResult, IDialogService } from 'ng-dialog';
import { removeToken } from '../oauth/oauth-token.service';
import dialogTemplate from './account-select.dialog.html';
import template from './account-select.html';
import './account-select.scss';
import { getPlatforms } from './platform.service';
import { IComponentOptions, IController } from 'angular';

export const AccountSelectComponent: IComponentOptions = {
  template,
  controller: AccountSelectController,
  bindings: {
    currentAccount: '<'
  }
};

function AccountSelectController(
  this: IController,
  loadingTracker,
  ngDialog: IDialogService,
  $state: StateService
) {
  'ngInject';

  const vm = this;
  let dialogResult: IDialogOpenResult | null = null;

  vm.loadingTracker = loadingTracker;
  vm.accounts = [];

  vm.$onInit = () => {
    const loadAccountsPromise = getPlatforms()
      .then((accounts) => {
        vm.accounts = accounts;
      });
    loadingTracker.addPromise(loadAccountsPromise);
  };

  vm.logOut = (e) => {
    e.stopPropagation();

    removeToken();
    $state.go('login', { reauth: true });
  };

  vm.selectAccount = (e, account) => {
    e.stopPropagation();
    $state.go(account.destinyVersion === 1 ? 'destiny1' : 'destiny2', account);
  };

  vm.openDropdown = (e) => {
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
        controller($scope) {
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
