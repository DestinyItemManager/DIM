(function() {
  'use strict';

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
    .value('dimItemTier', {
      exotic: 'Exotic',
      legendary: 'Legendary',
      rare: 'Rare',
      uncommon: 'Uncommon',
      basic: 'Basic'
    })
    .value('dimCategory', {
      Subclass: [
        'Class'
      ],
      Weapons: [
        'Primary',
        'Special',
        'Heavy',
      ],
      Armor: [
        'Helmet',
        'Gauntlets',
        'Chest',
        'Leg',
        'ClassItem'
      ],
      General: [
        'Artifact',
        'Emote',
        'Emblem',
        'Armor',
        'Ghost',
        'Ship',
        'Vehicle',
        'Consumable',
        'Material'
      ]
    })
    .factory('loadingTracker', ['promiseTracker', function(promiseTracker) {
      return promiseTracker();
    }]);


  angular.module('dimApp')
    .run(['$window', '$rootScope', 'loadingTracker', '$timeout', 'toaster', 'SyncService', '$http',
      function($window, $rootScope, loadingTracker, $timeout, toaster, SyncService, $http) {


        $rootScope.loadingTracker = loadingTracker;

        //1 Hour
        $rootScope.inactivityLength = 60 * 60 * 1000;

        $rootScope.isUserInactive = function() {
          var currentTime = Date.now();

          //Has This User Been Inactive For More Than An Hour
          return ((currentTime) - $rootScope.lastActivity) > $rootScope.inactivityLength;
        };

        $rootScope.trackActivity = function() {
          $rootScope.lastActivity = Date.now();
        };

        //Track Our Initial Activity of Starting the App
        $rootScope.trackActivity();

        $window.initgapi = function() {
          SyncService.init();
        }
        SyncService.get()
          .then(function(data) {
            if (data) {
              var toastViewedFlag = data['220160411v35'] || null;
              if (_.isNull(toastViewedFlag)) {
                $timeout(function() {
                  $http.get('views/changelog-toaster.html?v=v3.5.1')
                    .then(function(changelog) {
                      toaster.pop({
                        type: 'info',
                        title: 'DIM v3.5.1 Released',
                        body: changelog.data,
                        timeout: 0,
                        bodyOutputType: 'trustedHtml',
                        showCloseButton: true,
                        clickHandler: function(a, b, c, d, e, f, g) {
                          if (b) {
                            return true;
                          }

                          return false;
                        },
                        onHideCallback: function() {

                          if ($('#20160411v35')
                            .is(':checked')) {
                            data['220160411v35'] = 1;
                            SyncService.set(data);
                          }
                        }
                      });
                    }, 3000);
                });
              }
            }
          });
      }
    ]);

  angular.module('dimApp')
    .config([
      'hotkeysProvider',
      function(hotkeysProvider) {
        hotkeysProvider.includeCheatSheet = false;
      }
    ])
    .config([
      '$compileProvider',
      function($compileProvider) {
        // Allow chrome-extension: URLs in ng-src
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|chrome-extension):|data:image\/)/);
      }
    ])
    .config(["rateLimiterConfigProvider", function(rateLimiterConfigProvider) {
      // Bungie's API will start throttling an API if it's called more than once per second. It does this
      // by making responses take 2s to return, not by sending an error code or throttling response. Choosing
      // our throttling limit to be 1 request every 1100ms lets us achieve best throughput while accounting for
      // what I assume is clock skew between Bungie's hosts when they calculate a global rate limit.
      rateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny\/TransferItem/, 1, 1100);
      rateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny\/EquipItem/, 1, 1100);
    }])
    .config(["$httpProvider", function($httpProvider) {
      $httpProvider.interceptors.push("rateLimiterInterceptor");
    }])
    .config(function($stateProvider, $urlRouterProvider) {
      $urlRouterProvider.otherwise("/inventory");

      $stateProvider
        .state('inventory', {
          url: "/inventory",
          templateUrl: "views/inventory.html"
        });
    });
})();

if (typeof window.onerror == "object") {
  window.onerror = function(err, url, line) {};
}

(function(window) {
  // Retain a reference to the previous global error handler, in case it has been set:
  var originalWindowErrorCallback = window.onerror;

  window.onerror = function customErrorHandler(errorMessage, url, lineNumber, columnNumber, errorObject) {
    var exceptionDescription = errorMessage;
    if (typeof errorObject !== 'undefined' && typeof errorObject.message !== 'undefined') {
      exceptionDescription = errorObject.message;
    }
    //
    // _gaq.push([
    //   'errorTracker._trackEvent',
    //   'DIM - Chrome Extension - v3.3',
    //   exceptionDescription,
    //   ' @ ' + url + ':' + lineNumber + ':' + columnNumber,
    //   0,
    //   true
    // ]);

    // If the previous "window.onerror" callback can be called, pass it the data:
    if (typeof originalWindowErrorCallback === 'function') {
      return originalWindowErrorCallback(errorMessage, url, lineNumber, columnNumber, errorObject);
    }
    // Otherwise, Let the default handler run:
    return false;
  };
})(window);
