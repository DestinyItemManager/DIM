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
        return ((currentTime) - $rootScope.lastActivity) > $rootScope.inactivityLength;
      };

      $rootScope.trackActivity = function() {
        $rootScope.lastActivity = Date.now();
      };

      //Track Our Initial Activity of Starting the App
      $rootScope.trackActivity();

      // chrome.storage.sync.get('2015.09.02-Blacksmith', function(data) {
      //   if (_.isNull(data) || _.isEmpty(data)) {
      //     $timeout(function() {
      //       toaster.pop({
      //         type: 'info',
      //         title: 'Blacksmith Shader Giveaway',
      //         body: '<p>The DIM team is giving away six Blacksmith shaders on Twitter to celebrate your #YearOneGear.</p><p>Visit us at <a href="https://twitter.com/ThisIsDIM/status/639237265944899584" target="_blank">@ThisIsDIM</a> on twitter or the <a href="https://www.reddit.com/r/DestinyItemManager/comments/3jfl0f/blacksmith_shader_giveaway/" target="_blank">/r/destinyitemmanager</a> subreddit to learn how to enter.</p><p>See you starside Guardians.</p><p><input style="margin-top: 1px; vertical-align: middle;" id="20150902Checkbox" type="checkbox"> <label for="20150902Checkbox">Hide This Popup</label></p>',
      //         timeout: 0,
      //         bodyOutputType: 'trustedHtml',
      //         showCloseButton: true,
      //         clickHandler: function(a,b,c,d,e,f,g) {
      //           if (b) {
      //             return true;
      //           }
      //
      //           return false;
      //         },
      //         onHideCallback: function() {
      //           if ($('#20150902Checkbox').is(':checked')) {
      //             chrome.storage.sync.set({
      //               "2015.09.02-Blacksmith": 1
      //             }, function(e) {});
      //           }
      //         }
      //       });
      //     }, 3000);
      //   }
      // });

      chrome.storage.sync.get('2016.01.18-Perf', function(data) {
        if (_.isNull(data) || _.isEmpty(data)) {
          $timeout(function() {
            toaster.pop({
              type: 'info',
              title: 'v3.2 Released',
              body: [
'<p>We\'ve added a \'Maximum Light\' loadout, greatly improved the performance while moving items, and added <span style="font-style: italic">is:year1</span> and <span style="font-style: italic">is:year2</span> filters.',
'<p><a href="http://bit.ly/1SssIq9" target="_blank">Learn more about the the updates in v3.2.</a>',
'<p>Follow us on: <a style="margin: 0 5px;" href="http://destinyitemmanager.reddit.com" target="_blank"><img title="/r/DIM on Reddit" style="vertical-align: text-bottom;" src="images/reddit.png"></a> <a style="margin: 0 5px;" href="http://twitter.com/ThisIsDIM" target="_blank"><img style="vertical-align: text-bottom;" title="@ThisIsDIM on Twitter" src="images/twitter.png"></a>',
'<p><input style="margin-top: 1px; vertical-align: middle;" id="20151010Checkbox" type="checkbox"> <label for="20151010Checkbox">Hide This Popup</label></p>'].join(''),
              timeout: 0,
              bodyOutputType: 'trustedHtml',
              showCloseButton: true,
              clickHandler: function(a,b,c,d,e,f,g) {
                if (b) {
                  return true;
                }

                return false;
              },
              onHideCallback: function() {
                if ($('#20151010Checkbox').is(':checked')) {
                  chrome.storage.sync.set({
                    "2016.01.18-Perf": 1
                  }, function(e) {});
                }
              }
            });
          }, 3000);
        }
      });
    }]);

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
        var currentImgSrcSanitizationWhitelist = $compileProvider.imgSrcSanitizationWhitelist();
        var newImgSrcSanitizationWhiteList = currentImgSrcSanitizationWhitelist.toString().slice(0, -1) + '|chrome-extension:' + currentImgSrcSanitizationWhitelist.toString().slice(-1);

        //console.log("Changing imgSrcSanitizationWhiteList from " + currentImgSrcSanitizationWhitelist + " to " + newImgSrcSanitizationWhiteList);
        $compileProvider.imgSrcSanitizationWhitelist(newImgSrcSanitizationWhiteList);
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
        });
    });
})();

$(document).ready(function() {
  if (verge.viewportW() !== $(window).width()) {
    $('body').addClass('pad-margin');
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = '.about.ngdialog-open.pad-margin #header, .app-settings.ngdialog-open.pad-margin #header, .support.ngdialog-open.pad-margin #header, .filters.ngdialog-open.pad-margin #header { padding-right: ' + (verge.viewportW() - $(window).width()) + 'px; }';
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
      if (typeof errorObject !== 'undefined' && typeof errorObject.message !== 'undefined') {
        exceptionDescription = errorObject.message;
      }
      //
      // _gaq.push([
      //   'errorTracker._trackEvent',
      //   'DIM - Chrome Extension - v3.2.0',
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
