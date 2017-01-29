console.time('First item directive built');

const angular = require('angular');

angular.module('dimApp')
  .config((localStorageServiceProvider) => {
    localStorageServiceProvider.setPrefix('');
  });

// Putting this comparison in a function defeats a constant-folding optimization
function compare(a, b) {
  return a === b;
}

angular.module('dimApp')
  .value('dimPlatformIds', {
    xbl: null,
    psn: null
  })
  .value('dimState', {
    membershipType: -1,
    active: null,
    debug: false
  })
  .value('dimFeatureFlags', {
    isExtension: window.chrome && window.chrome.extension,
    // Tags are off in release right now
    tagsEnabled: !compare('$DIM_FLAVOR', 'release'),
    compareEnabled: true,
    vendorsEnabled: true,
    qualityEnabled: true,
    // Additional debugging / item info tools
    debugMode: false,
    // Print debug info to console about item moves
    debugMoves: false,
    // show changelog toaster
    changelogToaster: compare('$DIM_FLAVOR', 'release') || compare('$DIM_FLAVOR', 'beta'),

    materialsExchangeEnabled: !compare('$DIM_FLAVOR', 'release'),
    // allow importing and exporting your DIM data to JSON
    importExport: compare('$DIM_FLAVOR', 'release')
  })
  .factory('loadingTracker', function(promiseTracker) {
    return promiseTracker();
  });


angular.module('dimApp')
  .run(function($window,
                $rootScope,
                $translate,
                loadingTracker,
                SyncService,
                dimInfoService,
                dimFeatureFlags,
                dimSettingsService) {
    $rootScope.loadingTracker = loadingTracker;

    // 1 Hour
    $rootScope.inactivityLength = 60 * 60 * 1000;

    $rootScope.isUserInactive = function() {
      var currentTime = Date.now();

      // Has This User Been Inactive For More Than An Hour
      return ((currentTime) - $rootScope.lastActivity) > $rootScope.inactivityLength;
    };

    $rootScope.trackActivity = function() {
      $rootScope.lastActivity = Date.now();
    };

    // Track Our Initial Activity of Starting the App
    $rootScope.trackActivity();

    $window.initgapi = function() {
      SyncService.init();
    };

    var chromeVersion = /Chrome\/(\d+)/.exec($window.navigator.userAgent);

    $rootScope.$on('dim-settings-loaded', function() {
      var language = dimSettingsService.language;
      if (chromeVersion && chromeVersion.length === 2 && parseInt(chromeVersion[1], 10) < 51) {
        dimInfoService.show('old-chrome', {
          title: $translate.instant('Help.UpgradeChrome'),
          view: 'views/' + language + '/upgrade-chrome.html?v=$DIM_VERSION',
          type: 'error'
        }, 0);
      }

      console.log('DIM v$DIM_VERSION - Please report any errors to https://www.reddit.com/r/destinyitemmanager');

      if (dimFeatureFlags.changelogToaster && compare('$DIM_FLAVOR', 'release')) {
        dimInfoService.show('changelogv$DIM_VERSION'.replace(/\./gi, ''), {
          title: compare('$DIM_FLAVOR', 'release') ? $translate.instant('Help.Version.Stable') : $translate.instant('Help.Version.Beta'),
          view: 'views/changelog-toaster' + (compare('$DIM_FLAVOR', 'release') ? '' : '-beta') + '.html?v=v$DIM_VERSION'
        });
      }
    });

    // http://www.arnaldocapo.com/blog/post/google-analytics-and-angularjs-with-ui-router/72
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/single-page-applications
    $rootScope.$on('$stateChangeSuccess', function() {
      // if (ga) {
      //   ga('set', 'page', $location.path());
      // Disable sending pageviews on state changes for now, over concerns that we'll go over our free GA limits.
      // ga('send', 'pageview');
      // }
    });
  });

angular.module('dimApp')
  .config(function(hotkeysProvider) {
    hotkeysProvider.includeCheatSheet = true;
  })
  .config(function($compileProvider) {
    // TODO: remove this depenency by fixing component bindings https://github.com/angular/angular.js/blob/master/CHANGELOG.md#breaking-changes-1
    $compileProvider.preAssignBindingsEnabled(true);
    // Allow chrome-extension: URLs in ng-src
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|chrome-extension):|data:image\/)/);
  })
  .config(function(ngHttpRateLimiterConfigProvider) {
    // Bungie's API will start throttling an API if it's called more than once per second. It does this
    // by making responses take 2s to return, not by sending an error code or throttling response. Choosing
    // our throttling limit to be 1 request every 1100ms lets us achieve best throughput while accounting for
    // what I assume is clock skew between Bungie's hosts when they calculate a global rate limit.
    ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny\/TransferItem/, 1, 1100);
    ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny\/EquipItem/, 1, 1100);
  })
  .config(function($httpProvider) {
    $httpProvider.interceptors.push("ngHttpRateLimiterInterceptor");
    if (!window.chrome || !window.chrome.extension) {
      $httpProvider.interceptors.push('http-refresh-token');
    }
  })
  .config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/inventory");

    $stateProvider
      .state('inventory', {
        url: '/inventory',
        templateUrl: require('app/views/inventory.template.html'),
      })
      .state('best', {
        url: '/best',
        templateUrl: require('app/views/best.template.html'),
      })
      .state('vendors', {
        url: '/vendors',
        templateUrl: require('app/views/vendors.template.html'),
      })
      .state('materials-exchange', {
        url: '/materials-exchange',
        templateUrl: require('app/views/mats-exchange.template.html'),
      })
      .state('debugItem', {
        url: '/debugItem/:itemId',
        templateUrl: require('app/views/debugItem.template.html'),
      })
      .state('developer', {
        url: '/developer',
        templateUrl: require('app/scripts/developer/developer.template.html'),
      })
      .state('login', {
        url: '/login',
        templateUrl: require('app/scripts/login/login.template.html'),
      });
  });

