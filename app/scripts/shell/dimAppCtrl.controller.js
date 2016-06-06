(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimAppCtrl', DimApp);

  DimApp.$inject = ['ngDialog', '$rootScope', 'loadingTracker', 'dimPlatformService', '$interval', 'hotkeys', '$timeout', 'dimStoreService', 'dimXurService', 'dimCsvService', 'dimSettingsService'];

  function DimApp(ngDialog, $rootScope, loadingTracker, dimPlatformService, $interval, hotkeys, $timeout, dimStoreService, dimXurService, dimCsvService, dimSettingsService) {
    var vm = this;
    var aboutResult = null;
    var settingResult = null;
    var supportResult = null;
    var filterResult = null;

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

    hotkeys.add({
      combo: ['i'],
      callback: function(event, hotkey) {
        $rootScope.$broadcast('dim-toggle-item-details');
      }
    });

    dimSettingsService.getSettings()
      .then(function(settings) {
        vm.showElements = settings.showElements;
      });

    $rootScope.$on('dim-settings-updated', function(event, arg) {
      if (_.has(arg, 'showElements')) {
        vm.showElements = arg.showElements;
      }
    });

    vm.showSetting = function(e) {
      e.stopPropagation();

      if(!_.isNull(settingResult)) {
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

    vm.showAbout = function(e) {
      e.stopPropagation();

      if(!_.isNull(aboutResult)) {
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
        if(!_.isNull(activePlatform)) {
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

      if(!_.isNull(supportResult)) {
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

      if(!_.isNull(filterResult)) {
        filterResult.close();
      } else {
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
          var spans = $('#filter-view span')
            .each(function() {
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
          $('body')
            .removeClass('filters');
        });
      }
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

    // Don't refresh more than once a minute
    var refresh = _.throttle(vm.refresh, 60 * 1000);
    
    vm.downloadCsvFiles = function(){
      dimCsvService.downloadCsvFiles(dimStoreService.getStores());
    };

    vm.startAutoRefreshTimer = function() {
      var secondsToWait = 360;

      $rootScope.autoRefreshTimer = $interval(function() {
        //Only Refresh If We're Not Already Doing Something
        //And We're Not Inactive
        if(!loadingTracker.active() && !$rootScope.isUserInactive() && document.visibilityState == 'visible') {
          refresh();
        }
      }, secondsToWait * 1000);
    };

    vm.startAutoRefreshTimer();

    $rootScope.$on('dim-settings-updated', function(event, arg) {
      if(_.has(arg, 'characterOrder')) {
        refresh();
      }
    });

    // Refresh when the user comes back to the page
    document.addEventListener("visibilitychange", function() {
      if(!loadingTracker.active() && !$rootScope.isUserInactive() && document.visibilityState == 'visible') {
        refresh();
      }
    }, false);
  }
})();


function addFilter(filter) {
  var input = $('input[name=filter]');
  var itemNameFilter = false;

  if(filter === 'item name') {
    itemNameFilter = true;
    filter = prompt("Enter an item name:");
    filter = filter.trim();
  }

  if(filter.indexOf('light:') == 0) {
    var lightFilterType = filter.substring(6);
    var light = prompt("Enter a light value:");
    if(light) {
      light = light.trim();
    } else {
      return;
    }
    filter = 'light:';
    switch(lightFilterType) {
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


  if(itemNameFilter) {
    input.val(filter + ((text.length > 0) ? ' ' + text : ''));
  } else if((text + ' ')
    .indexOf(filter + ' ') < 0) {
    if(text.length > 0) {
      input.val(text + ' ' + filter);
    } else {
      input.val(filter);
    }
  }

  input.change();
}
