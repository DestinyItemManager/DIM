// Putting this comparison in a function defeats a constant-folding optimization
function compare(a, b) {
  return a === b;
}

angular.module('dimApp')
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
  .factory('loadingTracker', ['promiseTracker', function(promiseTracker) {
    return promiseTracker();
  }]);


angular.module('dimApp')
  .run(['$window', '$rootScope', '$translate', 'loadingTracker', '$timeout', 'toaster', '$http', 'SyncService', 'dimInfoService', 'dimFeatureFlags', 'dimSettingsService',
    function($window, $rootScope, $translate, loadingTracker, $timeout, toaster, $http, SyncService, dimInfoService, dimFeatureFlags, dimSettingsService) {
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
            title: '$DIM_FLAVOR' === 'release' ? $translate.instant('Help.Version.Stable') : $translate.instant('Help.Version.Beta'),
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
    }
  ]);
