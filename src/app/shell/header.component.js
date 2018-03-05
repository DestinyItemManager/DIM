import { subscribeOnScope } from '../rx-utils';
import { settings } from '../settings/settings';
import { getActiveAccountStream } from '../accounts/platform.service';
import template from './header.html';
import './header.scss';

// TODO: Today we share one header everywhere, and show/hide bits of it depending on the circumstance.
// It'd be nice if there were a cleaner way to go about this.
export const HeaderComponent = {
  template,
  controller: HeaderController
};

function HeaderController(
  ngDialog,
  $rootScope,
  hotkeys,
  $transitions,
  $state,
  $scope,
  $injector
) {
  'ngInject';

  const vm = this;

  // Variables for templates that webpack does not automatically correct.
  vm.$DIM_VERSION = $DIM_VERSION;
  vm.$DIM_FLAVOR = $DIM_FLAVOR;

  let vendorsSubscription;
  vm.xurAvailable = false;
  vm.settings = settings;

  vm.featureFlags = {
    bugReportLink: $DIM_FLAVOR !== 'release',
    vendors: $featureFlags.vendors
  };

  vm.$onInit = function() {
    subscribeOnScope($scope, getActiveAccountStream(), (account) => {
      vm.account = account;
      vm.destinyVersion = account.destinyVersion;
    });
  };

  const unregisterTransitionHook = $transitions.onSuccess({ to: 'destiny1.*' }, () => {
    updateXur();
  });

  vm.$onDestroy = function() {
    unregisterTransitionHook();
  };

  function updateXur() {
    if (vm.destinyVersion === 1 && !vendorsSubscription) {
      vm.showXur = showPopupFunction('xur', '<xur></xur>');

      const dimVendorService = $injector.get('dimVendorService'); // hack for code splitting

      vendorsSubscription = subscribeOnScope($scope, dimVendorService.getVendorsStream(vm.account), ([_stores, vendors]) => {
        const xur = 2796397637;
        vm.xurAvailable = Boolean(vendors[xur]);
      });
    }
  }

  /**
   * Show a popup dialog containing the given template. Its class
   * will be based on the name.
   */
  function showPopupFunction(name, template) {
    let result;
    return function(e) {
      e.stopPropagation();

      if (result) {
        result.close();
      } else {
        ngDialog.closeAll();
        result = ngDialog.open({
          template: template,
          className: name,
          appendClassName: 'modal-dialog'
        });

        result.closePromise.then(() => {
          result = null;
        });
      }
    };
  }
}
