(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimAppCtrl', DimApp);

  DimApp.$inject = ['ngDialog', '$rootScope', 'loadingTracker', 'dimPlatformService', '$interval', 'hotkeys', '$timeout', 'dimStoreService', 'dimXurService', 'dimVendorService', 'dimSettingsService', '$window', '$scope', '$state'];

  function DimApp(ngDialog, $rootScope, loadingTracker, dimPlatformService, $interval, hotkeys, $timeout, dimStoreService, dimXurService, dimVendorService, dimSettingsService, $window, $scope, $state) {
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


    hotkeys.add({
      combo: ['f'],
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
      callback: function() {
        vm.refresh();
      }
    });

    hotkeys.add({
      combo: ['i'],
      callback: function() {
        $rootScope.$broadcast('dim-toggle-item-details');
      }
    });

    $rootScope.$on('dim-active-platform-updated', function(e, args) {
      loadingTracker.addPromise(dimVendorService.updateVendorItems(args.platform.type));
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

    dimXurService.updateXur();
    vm.xur = dimXurService;

    vm.refresh = function refresh() {
      var activePlatform = dimPlatformService.getActive();
      if (activePlatform !== null) {
        $rootScope.$broadcast('dim-active-platform-updated', {
          platform: activePlatform
        });
        dimXurService.updateXur();
      }
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
