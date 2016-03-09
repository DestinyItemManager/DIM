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
    .run(['$rootScope', 'loadingTracker', '$cookies', '$timeout', 'toaster',
      function($rootScope, loadingTracker, $cookies, $timeout, toaster) {
        $rootScope.loadingTracker = loadingTracker;

        //1 Hour
        $rootScope.inactivityLength = 60 * 60 * 1000;

        $rootScope.isUserInactive = function() {
          var currentTime = Date.now();

          //Has This User Been Inactive For More Than An Hour
          return((currentTime) - $rootScope.lastActivity) > $rootScope.inactivityLength;
        };

        $rootScope.trackActivity = function() {
          $rootScope.lastActivity = Date.now();
        };

        //Track Our Initial Activity of Starting the App
        $rootScope.trackActivity();

        chrome.storage.sync.get('2016.03.04-v3.3.2', function(data) {
          if(_.isNull(data) || _.isEmpty(data)) {
            $timeout(function() {
              toaster.pop({
                type: 'info',
                title: 'DIM v3.3.2 Released',
                body: [
                  '<p>It\'s our cake-day!  Let us celebrate by putting out another feature rich update.',
                  '<p>We\'ve added autocomplete to the search box, and added new search terms. You can lock/unlock items from their details screen.  You can view your character stats in the header now.  Finally, you can copy a modified loadout to easily save variants.',
                  '<p>Our <a href="https://www.reddit.com/r/DestinyItemManager/comments/48wof0/v332_released_happy_cake_day/" target="_blank">changelog</a> is available if you would like to know more.',
                  '<p>Visit us on Twitter and Reddit to learn more about these and other updates in v3.3.2',
                  '<p>Follow us on: <a style="margin: 0 5px;" href="http://destinyitemmanager.reddit.com" target="_blank"><i<i class="fa fa-reddit fa-2x"></i></a> <a style="margin: 0 5px;" href="http://twitter.com/ThisIsDIM" target="_blank"><i class="fa fa-twitter fa-2x"></i></a>',
                  '<p><input style="margin-top: 1px; vertical-align: middle;" id="20160304v332" type="checkbox"> <label for="20160304v332">Hide This Popup</label></p>'
                ].join(''),
                timeout: 0,
                bodyOutputType: 'trustedHtml',
                showCloseButton: true,
                clickHandler: function(a, b, c, d, e, f, g) {
                  if(b) {
                    return true;
                  }

                  return false;
                },
                onHideCallback: function() {
                  if($('#20160304v332')
                    .is(':checked')) {
                    chrome.storage.sync.set({
                      "2016.03.04-v3.3.2": 1
                    }, function(e) {});
                  }
                }
              });
            }, 3000);
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
      rateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny\/TransferItem/, 1, 1250);
      rateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny\/EquipItem/, 1, 1250);
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
        }).state('best', {
          url: "/best",
          templateUrl: "views/best.html"
        });
    });
})();

$(document).ready(function() {
  var viewportWidth = Math.max(document.documentElement.clientWidth,
                               document.documentElement.innerWidth);
  if (viewportWidth !== $(window).width()) {
    $('body').addClass('pad-margin');
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = '.about.ngdialog-open.pad-margin #header, .app-settings.ngdialog-open.pad-margin #header, .support.ngdialog-open.pad-margin #header, .filters.ngdialog-open.pad-margin #header { padding-right: ' + (viewportWidth - $(window).width()) + 'px; }';
    document.getElementsByTagName('head')[0].appendChild(style);
  }
});

if (typeof window.onerror == "object") {
  window.onerror = function(err, url, line) {};
}

(function(window) {
  // Retain a reference to the previous global error handler, in case it has been set:
  var originalWindowErrorCallback = window.onerror;

  window.onerror = function customErrorHandler(errorMessage, url, lineNumber, columnNumber, errorObject) {
    var exceptionDescription = errorMessage;
    if(typeof errorObject !== 'undefined' && typeof errorObject.message !== 'undefined') {
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
    if(typeof originalWindowErrorCallback === 'function') {
      return originalWindowErrorCallback(errorMessage, url, lineNumber, columnNumber, errorObject);
    }
    // Otherwise, Let the default handler run:
    return false;
  };
})(window);
