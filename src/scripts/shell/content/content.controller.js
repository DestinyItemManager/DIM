import _ from 'underscore';

import aboutTemplate from 'app/views/about.html';
import supportTemplate from 'app/views/support.html';
import filtersTemplate from 'app/views/filters.html';

// This is outside the class in order to make it a truly global
// fire-once function, so no matter how many times they visit this
// page, they'll only see the popup once per session.
const showExtensionDeprecation = _.once(($i18next, dimInfoService) => {
  dimInfoService.show('extension-deprecated', {
    title: $i18next.t('Help.ExtensionDeprecatedTitle'),
    body: $i18next.t('Help.ExtensionDeprecatedMessage'),
    type: 'info'
  }, 0);
});

export default class ContentController {
  constructor(
    dimState,
    ngDialog,
    $rootScope,
    loadingTracker,
    dimPlatformService,
    $interval,
    hotkeys,
    dimXurService,
    dimSettingsService,
    $scope,
    $state,
    dimVendorService,
    $i18next,
    dimInfoService
  ) {
    'ngInject';

    const vm = this;

    // Variables for templates that webpack does not automatically correct.
    vm.$DIM_VERSION = $DIM_VERSION;
    vm.$DIM_FLAVOR = $DIM_FLAVOR;
    vm.$DIM_CHANGELOG = $DIM_CHANGELOG;

    vm.settings = dimSettingsService;
    $scope.$watch(() => vm.settings.itemSize, (size) => {
      document.querySelector('html').style.setProperty("--item-size", `${size}px`);
    });
    $scope.$watch(() => vm.settings.charCol, (cols) => {
      document.querySelector('html').style.setProperty("--character-columns", cols);
    });
    $scope.$watch(() => vm.settings.vaultMaxCol, (cols) => {
      document.querySelector('html').style.setProperty("--vault-max-columns", cols);
    });

    vm.featureFlags = {
      vendorsEnabled: $featureFlags.vendorsEnabled,
      activities: $featureFlags.activities
    };
    vm.vendorService = dimVendorService;

    hotkeys = hotkeys.bindTo($scope);

    hotkeys.add({
      combo: ['i'],
      description: $i18next.t('Hotkey.ToggleDetails'),
      callback: function() {
        $rootScope.$broadcast('dim-toggle-item-details');
      }
    });

    if ($featureFlags.tagsEnabled) {
      dimSettingsService.itemTags.forEach((tag) => {
        if (tag.hotkey) {
          hotkeys.add({
            combo: [tag.hotkey],
            description: $i18next.t('Hotkey.MarkItemAs', {
              tag: $i18next.t(tag.label)
            }),
            callback: function() {
              $rootScope.$broadcast('dim-item-tag', { tag: tag.type });
            }
          });
        }
      });
    }

    hotkeys.add({
      combo: ['ctrl+alt+shift+d'],
      callback: function() {
        dimState.debug = true;
        console.log("***** DIM DEBUG MODE ENABLED *****");
      }
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

    // TODO: make this into a ui-sref-toggle attribute directive
    vm.toggleState = function(name) {
      $state.go($state.is(name) ? 'inventory' : name);
    };

    vm.xur = dimXurService;

    // An abbreviated version of the messager from storage.component.js,
    // just so we can send an info popup.
    function messageHandler(event) {
      // We only accept messages from ourselves
      if (event.source !== window) {
        return;
      }

      switch (event.data.type) {
      case 'DIM_EXT_PONG':
        showExtensionDeprecation($i18next, dimInfoService);
        break;
      }
    }

    window.addEventListener('message', messageHandler, false);
    window.postMessage({ type: 'DIM_EXT_PING' }, "*");

    $scope.$on('$destroy', () => {
      window.removeEventListener('message', messageHandler);
    });
  }
}
