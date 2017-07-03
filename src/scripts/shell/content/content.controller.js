import aboutTemplate from 'app/views/about.html';
import supportTemplate from 'app/views/support.html';
import filtersTemplate from 'app/views/filters.html';

export default class ContentController {
  constructor(dimActivityTrackerService, dimState, ngDialog, $rootScope, loadingTracker, dimPlatformService, $interval, hotkeys, $timeout, dimStoreService, dimXurService, dimSettingsService, $window, $scope, $state, dimVendorService, $i18next) {
    'ngInject';

    const vm = this;

    // Variables for templates that webpack does not automatically correct.
    vm.$DIM_VERSION = $DIM_VERSION;
    vm.$DIM_FLAVOR = $DIM_FLAVOR;
    vm.$DIM_CHANGELOG = $DIM_CHANGELOG;

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
    if ($featureFlags.colorA11y) {
      $scope.$watch(() => vm.settings.colorA11y, (color) => {
        if (color && color !== '-') {
          document.querySelector('html').style.setProperty("--color-filter", `url(#${color.toLowerCase()})`);
        } else {
          document.querySelector('html').style.removeProperty("--color-filter");
        }
      });
    }

    vm.featureFlags = {
      vendorsEnabled: $featureFlags.vendorsEnabled,
      colorA11y: $featureFlags.colorA11y
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
  }
}
