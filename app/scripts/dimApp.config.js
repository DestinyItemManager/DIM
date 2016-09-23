(function() {
  'use strict';

  console.time('First item directive built');

  angular.module('dimApp')
    .value('dimPlatformIds', {
      xbl: null,
      psn: null
    })
    .value('dimState', {
      membershipType: -1,
      active: null,
      debug: true
    })
    .value('dimFeatureFlags', {
      // Tags are off in release right now
      tagsEnabled: ('$DIM_FLAVOR' !== 'release'),
      // vendors are off until we can make them lighter on the API
      vendorsEnabled: false,
      // Stats are off in release until we get better formulas
      qualityEnabled: true
    })
    .factory('loadingTracker', ['promiseTracker', function(promiseTracker) {
      return promiseTracker();
    }]);


  angular.module('dimApp')
    .run(['$window', '$rootScope', 'loadingTracker', '$timeout', 'toaster', '$http', 'SyncService', 'dimInfoService',
      function($window, $rootScope, loadingTracker, $timeout, toaster, $http, SyncService, dimInfoService) {
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
        if (chromeVersion && chromeVersion.length === 2 && parseInt(chromeVersion[1], 10) < 51) {
          dimInfoService.show('old-chrome', {
            title: 'Please Upgrade Chrome',
            view: 'views/upgrade-chrome.html?v=$DIM_VERSION',
            type: 'error'
          }, 0);
        }

        console.log('DIM v$DIM_VERSION - Please report any errors to https://www.reddit.com/r/destinyitemmanager');
        // eslint-disable-next-line no-constant-condition
        if ("$DIM_FLAVOR" === 'release' || "$DIM_FLAVOR" === 'beta') {
          dimInfoService.show('changelogv$DIM_VERSION'.replace(/\./gi, ''), {
            title: 'DIM v$DIM_VERSION Released',
            view: 'views/changelog-toaster.html?v=v$DIM_VERSION'
          });
        }

        // http://www.arnaldocapo.com/blog/post/google-analytics-and-angularjs-with-ui-router/72
        // https://developers.google.com/analytics/devguides/collection/analyticsjs/single-page-applications
        $rootScope.$on('$stateChangeSuccess', function() {
          // if (ga) {
          //   ga('set', 'page', $location.path());
            // Disable sending pageviews on state changes for now, over concerns that we'll go over our free GA limits.
            // ga('send', 'pageview');
          // }
        });

//        if (chrome && chrome.identity) {
//          chrome.identity.getAuthToken(function(account) {
//            if (!account) {
//              dimInfoService.show('chromesync', {
//                title: 'Profile is not syncing.',
//                type: 'warning',
//                body: [
//                  '<p>Unless you sign into Google Chrome, your settings and loadouts will not be saved between all of your devices.</p>',
//                  '<p><a href="https://www.google.com/chrome/browser/signin.html" target="_blank">Click here for more information.</a></p>'
//                ].join(''),
//                hide: 'Do not show this message again.',
//                func: function() {
//                  chrome.identity.getAuthToken({ interactive: true });
//                }
//              });
//            }
//            if (chrome.runtime.lastError) {
//              console.warn(chrome.runtime.lastError.message, 'DIM profile will not sync with other devices.');
//            }
//          });
//        }
      }
    ]);

  angular.module('dimApp')
    .config([
      'hotkeysProvider',
      function(hotkeysProvider) {
        hotkeysProvider.includeCheatSheet = true;
      }
    ])
    .config([
      '$compileProvider',
      function($compileProvider) {
        // Allow chrome-extension: URLs in ng-src
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|chrome-extension):|data:image\/)/);
      }
    ])
    .config(["ngHttpRateLimiterConfigProvider", function(rateLimiterConfigProvider) {
      // Bungie's API will start throttling an API if it's called more than once per second. It does this
      // by making responses take 2s to return, not by sending an error code or throttling response. Choosing
      // our throttling limit to be 1 request every 1100ms lets us achieve best throughput while accounting for
      // what I assume is clock skew between Bungie's hosts when they calculate a global rate limit.
      rateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny\/TransferItem/, 1, 1100);
      rateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny\/EquipItem/, 1, 1100);
    }])
    .config(["$httpProvider", function($httpProvider) {
      $httpProvider.interceptors.push("ngHttpRateLimiterInterceptor");
    }])
    .config(function($stateProvider, $urlRouterProvider) {
      $urlRouterProvider.otherwise("/inventory");

      $stateProvider
        .state('inventory', {
          url: "/inventory",
          templateUrl: "views/inventory.html"
        })
        .state('best', {
          url: "/best",
          templateUrl: "views/best.html"
        })
        .state('vendors', {
          url: "/vendors",
          templateUrl: "views/vendors.html"
        });
    });
})();
