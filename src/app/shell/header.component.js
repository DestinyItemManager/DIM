import template from './header.html';
import './header.scss';
import { subscribeOnScope } from '../rx-utils';

// TODO: Today we share one header everywhere, and show/hide bits of it depending on the circumstance.
// It'd be nice if there were a cleaner way to go about this.
export const HeaderComponent = {
  template,
  controller: HeaderController
};

function HeaderController(
  dimState,
  ngDialog,
  $rootScope,
  hotkeys,
  dimSettingsService,
  $transitions,
  $state,
  $scope,
  $injector,
  dimPlatformService
) {
  'ngInject';

  const vm = this;

  // Variables for templates that webpack does not automatically correct.
  vm.$DIM_VERSION = $DIM_VERSION;
  vm.$DIM_FLAVOR = $DIM_FLAVOR;

  let vendorsSubscription;
  vm.xurAvailable = false;
  vm.settings = dimSettingsService;

  vm.featureFlags = {
    bugReportLink: $DIM_FLAVOR !== 'release'
  };

  vm.$onInit = function() {
    subscribeOnScope($scope, dimPlatformService.getActiveAccountStream(), (account) => {
      vm.account = account;
      vm.destinyVersion = account.destinyVersion;
    });
  };

  $transitions.onSuccess({ to: 'destiny1' }, (transition) => {
    updateXur();
  });

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
