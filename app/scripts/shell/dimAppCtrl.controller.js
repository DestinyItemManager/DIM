(function() {
  'use strict';

  angular.module('dimApp').controller('dimAppCtrl', DimApp);

  DimApp.$inject = ['ngDialog', '$rootScope', 'dimPlatformService', 'dimStoreService', '$interval', 'hotkeys', '$timeout', 'dimStoreService'];

  function DimApp(ngDialog, $rootScope, dimPlatformService, storeService, $interval, hotkeys, $timeout, dimStoreService) {
    var vm = this;
    var aboutResult = null;
    var settingResult = null;
    var supportResult = null;
    var filterResult  = null;

    hotkeys.add({
      combo: ['f'],
      callback: function(event, hotkey) {
        $rootScope.$broadcast('dim-focus-filter-input');

        event.preventDefault();
        event.stopPropagation();
      }
    });

    hotkeys.add({
      combo: ['esc'],
      allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
      callback: function(event, hotkey) {
        $rootScope.$broadcast('dim-escape-filter-input');
      }
    });

    hotkeys.add({
      combo: ['r'],
      callback: function(event, hotkey) {
        vm.refresh();
      }
    });

    vm.settings = {
      itemDetails: false,
      itemStat: false,
      condensedItems: false,
      characterOrder: 'mostRecent'
    };

    vm.showSetting = function(e) {
      e.stopPropagation();

      if (!_.isNull(settingResult)) {
        settingResult.close();
      } else {
        ngDialog.closeAll();

        settingResult = ngDialog.open({
          template: 'views/setting.html',
          overlay: false,
          className: 'app-settings',
          scope: $('body > div').scope()
        });
        $('body').addClass('app-settings');

        settingResult.closePromise.then(function() {
          settingResult = null;
          $('body').removeClass('app-settings');
        });
      }
    };

    vm.showAbout = function(e) {
      e.stopPropagation();

      if (!_.isNull(aboutResult)) {
        aboutResult.close();
      } else {
        ngDialog.closeAll();

        aboutResult = ngDialog.open({
          template: 'views/about.html',
          overlay: false,
          className: 'about',
          scope: $('body > div').scope()
        });
        $('body').addClass('about');

        aboutResult.closePromise.then(function() {
          aboutResult = null;
          $('body').removeClass('about');
        });
      }
    };

    vm.refresh = function refresh() {
      (function(activePlatform) {
        if (!_.isNull(activePlatform)) {
          $rootScope.$broadcast('dim-active-platform-updated', { platform: activePlatform });
        }
      })(dimPlatformService.getActive());
    };

    vm.showSupport = function(e) {
      e.stopPropagation();

      if (!_.isNull(supportResult)) {
        supportResult.close();
      } else {
        ngDialog.closeAll();

        supportResult = ngDialog.open({
          template: 'views/support.html',
          overlay: false,
          className: 'support',
          scope: $('body > div').scope()
        });
        $('body').addClass('support');

        supportResult.closePromise.then(function() {
          supportResult = null;
          $('body').removeClass('support');
        });
      }
    };

    vm.showFilters = function(e) {
      e.stopPropagation();

      if (!_.isNull(filterResult)) {
        filterResult.close();
      } else {
        ngDialog.closeAll();

        filterResult = ngDialog.open({
          template: 'views/filters.html',
          overlay: false,
          className: 'filters',
          scope: $('body > div').scope()
        });
        $('body').addClass('filters');

        setTimeout(function() {
          var spans = $('#filter-view span').each(function() {
            var item = $(this);
            var text = item.text();

            item.click(function() {
              addFilter(text);
            });
          });
          //<span onclick="addFilter('is:arc')">
        }, 250);

        filterResult.closePromise.then(function() {
          filterResult = null;
          $('body').removeClass('filters');
        });
      }
    };

    vm.closeLoadoutPopup = function closeLoadoutPopup() {
      if (!_.isNull(aboutResult) || !_.isNull(settingResult) || !_.isNull(supportResult) || !_.isNull(filterResult)) {
        ngDialog.closeAll();
      }
    };

    vm.startAutoRefreshTimer = function () {
      var secondsToWait = 360;

      $rootScope.autoRefreshTimer = $interval(function () {
       //Only Refresh If We're Not Already Doing Something
       //And We're Not Inactive
       if (!$rootScope.loadingTracker.active() && !$rootScope.isUserInactive()) {
         vm.refresh();
       }
      }, secondsToWait * 1000);
    };

    vm.startAutoRefreshTimer();

    var refresh = _.debounce(vm.refresh, 300);

    $rootScope.$on('dim-settings-updated', function(event, arg) {
      // if ((!_.has(arg, 'charCol')) && (!_.has(arg, 'vaultCol'))) {
        refresh();
      // }
    });
  }
})();


function addFilter(filter) {
  var input = $('input[name=filter]');
  var itemNameFilter = false;

  if (filter === 'item name') {
    itemNameFilter = true;
    filter = prompt("Enter an item name:");
    filter = filter.trim();
  }

  var text = input.val();


  if (itemNameFilter) {
    input.val(filter + ((text.length > 0) ? ' ' + text : ''));
  } else if ((text + ' ').indexOf(filter + ' ') < 0) {
    if (text.length > 0) {
      input.val(text + ' ' + filter);
    } else {
      input.val(filter);
    }
  }

  input.change();
}
