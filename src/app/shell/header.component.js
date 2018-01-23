import template from './header.html';
import './header.scss';

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
  $injector
) {
  'ngInject';

  const vm = this;

  // Variables for templates that webpack does not automatically correct.
  vm.$DIM_VERSION = $DIM_VERSION;
  vm.$DIM_FLAVOR = $DIM_FLAVOR;
  vm.$DIM_CHANGELOG = $DIM_CHANGELOG;

  vm.settings = dimSettingsService;

  vm.featureFlags = {
    bugReportLink: $DIM_FLAVOR !== 'release'
  };

  vm.$onInit = function() {
    vm.destinyVersion = getCurrentDestinyVersion();

    // This hacks around the fact that dimXurService isn't defined until the destiny1 modules are lazy-loaded
    if (vm.destinyVersion === 1) {
      const dimXurService = $injector.get('dimXurService');
      vm.showXur = showPopupFunction('xur', '<xur></xur>');
      vm.xur = dimXurService;
    }
  };

  function getCurrentDestinyVersion() {
    // TODO there must be a better way of doing this?
    if ($state.includes('destiny1')) {
      return 1;
    } else if ($state.includes('destiny2')) {
      return 2;
    }
    return null;
  }

  $transitions.onSuccess({ }, () => vm.$onInit());

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
