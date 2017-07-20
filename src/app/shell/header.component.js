import template from './header.html';
import aboutTemplate from 'app/views/about.html';
import supportTemplate from 'app/views/support.html';
import filtersTemplate from 'app/views/filters.html';
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
  dimXurService,
  dimSettingsService,
  $transitions,
  $state
) {
  'ngInject';

  const vm = this;

  // Variables for templates that webpack does not automatically correct.
  vm.$DIM_VERSION = $DIM_VERSION;
  vm.$DIM_FLAVOR = $DIM_FLAVOR;
  vm.$DIM_CHANGELOG = $DIM_CHANGELOG;

  vm.settings = dimSettingsService;

  vm.featureFlags = {
    vendorsEnabled: $featureFlags.vendorsEnabled,
    activities: $featureFlags.activities
  };

  vm.destinyVersion = getCurrentDestinyVersion($state);

  function getCurrentDestinyVersion() {
    // TODO there must be a better way of doing this?
    if ($state.includes('destiny1')) {
      return 1;
    } else if ($state.includes('destiny2')) {
      return 2;
    }
    return null;
  }

  $transitions.onSuccess({ }, () => {
    vm.destinyVersion = getCurrentDestinyVersion();
  });

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

  vm.showSetting = showPopupFunction('settings', '<settings></settings>');
  vm.showAbout = showPopupFunction('about', aboutTemplate);
  vm.showSupport = showPopupFunction('support', supportTemplate);
  vm.showFilters = showPopupFunction('filters', filtersTemplate);
  vm.showXur = showPopupFunction('xur', '<xur></xur>');

  vm.xur = dimXurService;
}
