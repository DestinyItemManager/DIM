(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimAppCtrl', DimApp);

  DimApp.$inject = ['ngDialog', '$rootScope', 'loadingTracker', 'dimPlatformService', '$interval', 'hotkeys', '$timeout', 'dimStoreService', 'dimXurService', 'dimSettingsService', '$window', '$scope', '$state', 'dimLoadoutService', '$q'];

  function DimApp(ngDialog, $rootScope, loadingTracker, dimPlatformService, $interval, hotkeys, $timeout, dimStoreService, dimXurService, dimSettingsService, $window, $scope, $state, dimLoadoutService, $q) {
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

    hotkeys.add({
      combo: ['x'],
      description: "Clear new items",
      callback: function() {
        dimStoreService.clearNewItems();
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

    $scope.$on('dim-stores-updated', function() {
      vm.showRandomLoadout = true;
    });

    vm.showRandomLoadout = false;
    vm.disableRandomLoadout = false;

    vm.applyRandomLoadout = function() {
      if (vm.disableRandomLoadout) {
        return;
      }

      if (!$window.confirm('Randomize your equipped weapons, armor, ghost, and artifact?')) {
        return;
      }

      vm.disableRandomLoadout = true;

      $q.when(dimStoreService.getStores())
        .then((stores) => {
          const store = _.reduce(stores, (memo, store) => {
            if (!memo) {
              return store;
            }
            const d1 = new Date(store.lastPlayed);

            return (d1 >= memo) ? store : memo;
          }, null);

          if (store) {
            const classTypeId = ({
              titan: 0,
              hunter: 1,
              warlock: 2
            })[store.class];

            const checkClassType = function(classType) {
              return ((classType === 3) || (classType === classTypeId));
            };

            const types = ['Class',
              'Primary',
              'Special',
              'Heavy',
              'Helmet',
              'Gauntlets',
              'Chest',
              'Leg',
              'ClassItem',
              'Artifact',
              'Ghost'];

            let accountItems = [];
            const items = {};

            _.each(stores, (store) => {
              accountItems = accountItems.concat(_.filter(store.items, (item) => checkClassType(item.classType)));
            });

            const foundExotic = {};

            var fn = (type) => (item) => ((item.type === type) &&
              item.equipment &&
              (store.level >= item.equipRequiredLevel) &&
              (item.typeName !== 'Mask' || ((item.typeName === 'Mask') && (item.tier === 'Legendary'))) &&
              (!item.notransfer || (item.notransfer && (item.owner === store.id))) &&
              (!foundExotic[item.bucket.sort] || (foundExotic[item.bucket.sort] && !item.isExotic)));

            _.each(types, (type) => {
              const filteredItems = _.filter(accountItems, fn(type));
              const random = filteredItems[Math.floor(Math.random() * filteredItems.length)];

              if (!foundExotic[random.bucket.sort]) {
                foundExotic[random.bucket.sort] = random.isExotic;
              }

              const clone = angular.extend(angular.copy(random), { equipped: true });
              items[type.toLowerCase()] = [clone];
            });

            return dimLoadoutService.applyLoadout(store, {
              classType: -1,
              name: 'random',
              items: items
            });
          }
          return $q.reject();
        })
        .then(() => {
          vm.disableRandomLoadout = false;
        })
        .catch(() => {
          vm.disableRandomLoadout = false;
        });
    };
  }
})();
