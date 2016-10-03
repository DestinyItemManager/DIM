(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimAppCtrl', DimApp);

  DimApp.$inject = ['ngDialog', '$rootScope', 'loadingTracker', 'dimPlatformService', '$interval', 'hotkeys', '$timeout', 'dimStoreService', 'dimXurService', 'dimSettingsService', '$window', '$scope', '$state', 'dimFeatureFlags'];

  function DimApp(ngDialog, $rootScope, loadingTracker, dimPlatformService, $interval, hotkeys, $timeout, dimStoreService, dimXurService, dimSettingsService, $window, $scope, $state, dimFeatureFlags) {
    var vm = this;

    vm.settings = dimSettingsService;
    $scope.$watch('app.settings.itemSize', function(size) {
      document.querySelector('html').style.setProperty("--item-size", size + 'px');
    });
    $scope.$watch('app.settings.charCol', function(cols) {
      document.querySelector('html').style.setProperty("--character-columns", cols);
    });

    $scope.$watch('app.settings.vaultMaxCol', function(cols) {
      document.querySelector('html').style.setProperty("--vault-max-columns", cols);
    });

    vm.featureFlags = dimFeatureFlags;

    hotkeys.add({
      combo: ['f'],
      description: "Start a search",
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
            template: 'views/' + name + '.html',
            className: name,
            appendClassName: 'modal-dialog'
          });

          result.closePromise.then(function() {
            result = null;
          });

          // if (ga) {
            // Disable sending pageviews on popups for now, over concerns that we'll go over our free GA limits.
            // Send a virtual pageview event, even though this is a popup
            // ga('send', 'pageview', { page: '/' + name });
          // }
        }
      };
    }

    vm.showSetting = showPopupFunction('setting');
    vm.showAbout = showPopupFunction('about');
    vm.showSupport = showPopupFunction('support');
    vm.showFilters = showPopupFunction('filters');
    vm.showXur = showPopupFunction('xur');

    vm.toggleMinMax = function(e) {
      $state.go($state.is('best') ? 'inventory' : 'best');
    };

    vm.toggleVendors = function(e) {
      $state.go($state.is('vendors') ? 'inventory' : 'vendors');
    };

    dimXurService.updateXur();
    vm.xur = dimXurService;

    vm.refresh = function refresh() {
      loadingTracker.addPromise(dimStoreService.reloadStores());
      dimXurService.updateXur();
    };

    // Don't refresh more than once a minute
    var refresh = _.throttle(vm.refresh, 60 * 1000);

    vm.startAutoRefreshTimer = function() {
      var secondsToWait = 360;

      $rootScope.autoRefreshTimer = $interval(function() {
        // Only Refresh If We're Not Already Doing Something
        // And We're Not Inactive
        if (!loadingTracker.active() && !$rootScope.isUserInactive() && document.visibilityState === 'visible') {
          refresh();
        }
      }, secondsToWait * 1000);
    };

    vm.startAutoRefreshTimer();

    // Refresh when the user comes back to the page
    document.addEventListener("visibilitychange", function() {
      if (!loadingTracker.active() && !$rootScope.isUserInactive() && document.visibilityState === 'visible') {
        refresh();
      }
    }, false);
  }
})();
