(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimAppCtrl', DimApp);

  DimApp.$inject = ['ngDialog', '$rootScope', 'loadingTracker', 'dimPlatformService', 'dimStoreService', '$interval', 'hotkeys', '$timeout', 'dimStoreService', 'dimXurService', 'dimVendorService', 'dimCsvService', 'dimSettingsService', '$window', '$scope', '$state', 'dimManifestService'];

  function DimApp(ngDialog, $rootScope, loadingTracker, dimPlatformService, storeService, $interval, hotkeys, $timeout, dimStoreService, dimXurService, dimVendorService, dimCsvService, dimSettingsService, $window, $scope, $state, dimManifestService) {
    var vm = this;
    var aboutResult = null;
    var settingResult = null;
    var supportResult = null;
    var filterResult = null;

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


    dimManifestService.getManifest().then(function(db) {
      console.log(db);
      console.log(db.exec("SELECT * FROM DestinyInventoryItemDefinition where id = -2146969240"));
      console.timeEnd('manifest');
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

    vm.showSetting = function(e) {
      e.stopPropagation();

      if (settingResult) {
        settingResult.close();
      } else {
        ngDialog.closeAll();

        settingResult = ngDialog.open({
          template: 'views/setting.html',
          className: 'app-settings',
          scope: $('body > div')
            .scope()
        });
        $('body')
          .addClass('app-settings');

        settingResult.closePromise.then(function() {
          settingResult = null;
          $('body')
            .removeClass('app-settings');
        });
      }
    };

    vm.toggleMinMax = function(e) {
      $state.go($state.is('best') ? 'inventory' : 'best');
    };

    vm.showAbout = function(e) {
      e.stopPropagation();

      if (aboutResult) {
        aboutResult.close();
      } else {
        ngDialog.closeAll();

        aboutResult = ngDialog.open({
          template: 'views/about.html',
          className: 'about',
          scope: $('body > div')
            .scope()
        });
        $('body')
          .addClass('about');

        aboutResult.closePromise.then(function() {
          aboutResult = null;
          $('body')
            .removeClass('about');
        });
      }
    };

    vm.refresh = function refresh() {
      (function(activePlatform) {
        if (!_.isNull(activePlatform)) {
          $rootScope.$broadcast('dim-active-platform-updated', {
            platform: activePlatform
          });
          dimXurService.updateXur();
        }
      })(dimPlatformService.getActive());
    };
    dimXurService.updateXur();

    vm.showSupport = function(e) {
      e.stopPropagation();

      if (supportResult) {
        supportResult.close();
      } else {
        ngDialog.closeAll();

        supportResult = ngDialog.open({
          template: 'views/support.html',
          className: 'support',
          scope: $('body > div')
            .scope()
        });
        $('body')
          .addClass('support');

        supportResult.closePromise.then(function() {
          supportResult = null;
          $('body')
            .removeClass('support');
        });
      }
    };

    vm.showFilters = function(e) {
      e.stopPropagation();

      if (filterResult === null) {
        ngDialog.closeAll();

        filterResult = ngDialog.open({
          template: 'views/filters.html',
          className: 'filters',
          scope: $('body > div')
            .scope()
        });
        $('body')
          .addClass('filters');

        setTimeout(function() {
          $('#filter-view span')
            .each(function() {
              var item = $(this);
              var text = item.text();

              item.click(function() {
                addFilter(text);
              });
            });
          // <span onclick="addFilter('is:arc')">
        }, 250);

        filterResult.closePromise.then(function() {
          filterResult = null;
          $('body')
            .removeClass('filters');
        });
      } else {
        filterResult.close();
      }
    };

    vm.vendor = dimVendorService;
    vm.showVendors = function showVendors(e) {
      e.stopPropagation();

      ngDialog.open({
        template: 'views/vendors.html',
        className: 'vendor'
      }).closePromise.then(function() {
        ngDialog.closeAll();
      });
    };

    vm.xur = dimXurService;
    vm.showXur = function showXur(e) {
      e.stopPropagation();

      ngDialog.open({
        template: 'views/xur.html',
        className: 'xur'
      }).closePromise.then(function() {
        ngDialog.closeAll();
      });
    };

    vm.downloadWeaponCsv = function(){
      dimCsvService.downloadCsvFiles(dimStoreService.getStores(), "Weapons");
    };

    vm.downloadArmorCsv = function(){
      dimCsvService.downloadCsvFiles(dimStoreService.getStores(), "Armor");
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

    function addFilter(filter) {
      var input = $('input[name=filter]');
      var itemNameFilter = false;

      if (filter === 'item name') {
        itemNameFilter = true;
        filter = $window.prompt("Enter an item name:");
        filter = filter.trim();
      }

      if (filter.indexOf('light:') === 0 || filter.indexOf('quality:') === 0) {
        var type = filter.split(':');
        var lightFilterType = type[1];
        var light = $window.prompt("Enter a " + type[0] + " value:");
        if (light) {
          light = light.trim();
        } else {
          return;
        }
        filter = type[0] + ':';
        switch (lightFilterType) {
        case 'value':
          filter += light;
          break;
        case '>value':
          filter += '>' + light;
          break;
        case '>=value':
          filter += '>=' + light;
          break;
        case '<value':
          filter += '<' + light;
          break;
        case '<=value':
          filter += '<=' + light;
          break;
        default:
          filter = '';
          break;
        }
      }

      var text = input.val();


      if (itemNameFilter) {
        input.val(filter + ((text.length > 0) ? ' ' + text : ''));
      } else if ((text + ' ')
                 .indexOf(filter + ' ') < 0) {
        if (text.length > 0) {
          input.val(text + ' ' + filter);
        } else {
          input.val(filter);
        }
      }

      input.change();
    }
  }
})();
