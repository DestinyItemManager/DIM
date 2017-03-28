export default class ContentController {
  constructor(dimActivityTrackerService, dimState, ngDialog, $rootScope, loadingTracker, dimPlatformService, $interval, hotkeys, $timeout, dimStoreService, dimXurService, dimSettingsService, $window, $scope, $state, dimFeatureFlags, dimVendorService) {
    'ngInject';

    var vm = this;

    // Variables for templates that webpack does not automatically correct.
    vm.$DIM_VERSION = $DIM_VERSION;
    vm.$DIM_FLAVOR = $DIM_FLAVOR;
    vm.$DIM_CHANGELOG = $DIM_CHANGELOG;

    vm.loadingTracker = loadingTracker;
    vm.platforms = [];

    vm.platformChange = function platformChange(platform) {
      loadingTracker.addPromise(dimPlatformService.setActive(platform));
    };

    $scope.$on('dim-platforms-updated', function(e, args) {
      vm.platforms = args.platforms;
    });

    $scope.$on('dim-active-platform-updated', function(e, args) {
      dimState.active = vm.currentPlatform = args.platform;
    });

    loadingTracker.addPromise(dimPlatformService.getPlatforms());

    vm.settings = dimSettingsService;
    $scope.$watch(() => { return vm.settings.itemSize; }, function(size) {
      document.querySelector('html').style.setProperty("--item-size", size + 'px');
    });
    $scope.$watch(() => { return vm.settings.charCol; }, function(cols) {
      document.querySelector('html').style.setProperty("--character-columns", cols);
    });

    $scope.$watch(() => { return vm.settings.vaultMaxCol; }, function(cols) {
      document.querySelector('html').style.setProperty("--vault-max-columns", cols);
    });

    vm.featureFlags = dimFeatureFlags;
    vm.vendorService = dimVendorService;

    hotkeys.add({
      combo: ['f'],
      description: 'Start a search',
      callback: function(event) {
        $rootScope.$broadcast('dim-focus-filter-input');

        event.preventDefault();
        event.stopPropagation();
      }
    });

    hotkeys.add({
      combo: ['esc'],
      allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
      callback: function() {
        $rootScope.$broadcast('dim-escape-filter-input');
      }
    });

    hotkeys.add({
      combo: ['r'],
      description: "Refresh inventory",
      callback: function() {
        vm.refresh();
      }
    });

    hotkeys.add({
      combo: ['i'],
      description: "Toggle showing full item details",
      callback: function() {
        $rootScope.$broadcast('dim-toggle-item-details');
      }
    });

    if (vm.featureFlags.tagsEnabled) {
      /* Add each hotkey manually until hotkeys can be translated.
          _.each(dimSettingsService.itemTags, (tag) => {
            if (tag.hotkey) {
              hotkeys.add({
                combo: [tag.hotkey],
                description: "Mark item as '" + tag.label + "'",
                callback: function() {
                  $rootScope.$broadcast('dim-item-tag', { tag: tag.type });
                }
              });
            }
          });
      */
      hotkeys.add({
        combo: ['!'],
        description: "Mark item as 'Favorite'",
        callback: function() {
          $rootScope.$broadcast('dim-item-tag', {
            tag: 'favorite'
          });
        }
      });

      hotkeys.add({
        combo: ['@'],
        description: "Mark item as 'Keep'",
        callback: function() {
          $rootScope.$broadcast('dim-item-tag', {
            tag: 'keep'
          });
        }
      });

      hotkeys.add({
        combo: ['#'],
        description: "Mark item as 'Junk'",
        callback: function() {
          $rootScope.$broadcast('dim-item-tag', {
            tag: 'junk'
          });
        }
      });

      hotkeys.add({
        combo: ['$'],
        description: "Mark item as 'Infuse'",
        callback: function() {
          $rootScope.$broadcast('dim-item-tag', {
            tag: 'infuse'
          });
        }
      });
    }

    hotkeys.add({
      combo: ['x'],
      description: "Clear new items",
      callback: function() {
        dimStoreService.clearNewItems();
      }
    });

    hotkeys.add({
      combo: ['ctrl+alt+shift+d'],
      callback: function() {
        dimFeatureFlags.debugMode = true;
        console.log("***** DIM DEBUG MODE ENABLED *****");
      }
    });

    /**
     * Show a popup dialog containing the given template. Its class
     * will be based on the name.
     */
    function showPopupFunction(name) {
      var result;
      return function(e) {
        e.stopPropagation();

        if (result) {
          result.close();
        } else {
          ngDialog.closeAll();
          result = ngDialog.open({
            template: require('app/views/' + name + '.template.html'),
            className: name,
            appendClassName: 'modal-dialog'
          });

          result.closePromise.then(function() {
            result = null;
          });
        }
      };
    }

    vm.showSetting = showPopupFunction('settings');
    vm.showAbout = showPopupFunction('about');
    vm.showSupport = showPopupFunction('support');
    vm.showFilters = showPopupFunction('filters');
    vm.showXur = showPopupFunction('xur');
    vm.showMatsExchange = showPopupFunction('mats-exchange');

    function toggleState(name) {
      return function(e) {
        $state.go($state.is(name) ? 'inventory' : name);
      };
    }

    vm.toggleMinMax = toggleState('best');
    vm.toggleVendors = toggleState('vendors');
    vm.toggleRecordBooks = toggleState('record-books');

    vm.xur = dimXurService;

    vm.refresh = function refresh() {
      loadingTracker.addPromise(dimStoreService.reloadStores());
    };
  }
}
