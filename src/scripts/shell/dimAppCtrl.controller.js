import angular from 'angular';

angular.module('dimApp')
  .controller('dimAppCtrl', DimApp);

function DimApp($ngRedux, dimActivityTrackerService, dimState, ngDialog, $rootScope, loadingTracker, dimPlatformService, $interval, hotkeys, $timeout, dimStoreService, dimXurService, dimSettingsService, $window, $scope, $state, dimFeatureFlags, dimVendorService) {
  'ngInject';

  var vm = this;

  vm.loadingTracker = loadingTracker;

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
  function showPopupFunction(name, translate) {
    var result;
    return function(e) {
      e.stopPropagation();

      var language = translate ? vm.settings.language + '/' : ''; // set language

      if (result) {
        result.close();
      } else {
        ngDialog.closeAll();
        result = ngDialog.open({
          template: require('app/views/' + language + name + '.template.html'),
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
  vm.showAbout = showPopupFunction('about', true);
  vm.showSupport = showPopupFunction('support', true);
  vm.showFilters = showPopupFunction('filters');
  vm.showXur = showPopupFunction('xur');
  vm.showMatsExchange = showPopupFunction('mats-exchange');

  vm.toggleMinMax = function(e) {
    $state.go($state.is('best') ? 'inventory' : 'best');
  };

  vm.toggleVendors = function(e) {
    $state.go($state.is('vendors') ? 'inventory' : 'vendors');
  };

  vm.xur = dimXurService;

  vm.refresh = function refresh() {
    loadingTracker.addPromise(dimStoreService.reloadStores());
  };
}