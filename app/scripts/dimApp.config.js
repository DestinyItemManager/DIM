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

        chrome.storage.sync.get('20160204CrimsonTheme', function(data) {
          if(_.isNull(data) || _.isEmpty(data) || data['20160204CrimsonTheme'] === 1) {
            $('body')
              .addClass('crimson');
            $(document)
              .ready(function() {
                $(document)
                  .octoberLeaves({
                    leafStyles: 3, // Number of leaf styles in the sprite (leaves.png)
                    speedC: 1, // Speed of leaves
                    rotation: 1, // Define rotation of leaves
                    rotationTrue: 1, // Whether leaves rotate (1) or not (0)
                    numberOfLeaves: 15, // Number of leaves
                    size: 20, // General size of leaves, final size is calculated randomly (with this number as general parameter)
                    cycleSpeed: 30 // <a href="http://www.jqueryscript.net/animation/">Animation</a> speed (Inverse frames per second) (10-100)
                  })
              });
          }
        });

        chrome.storage.sync.get('2016.02.04-Crimson', function(data) {
          if(_.isNull(data) || _.isEmpty(data)) {
            $timeout(function() {
              toaster.pop({
                type: 'info',
                title: 'Crimson Days, February 9th - 16th',
                body: [
                  '<p>We\'ve been looking forward to the Crimson Days. Our only bit of advice, <a href="http://i.imgur.com/5HrbN28.gif" target="_blank">never leave your wingman.</a>',
                  '<p>If you want to use the old theme, there is a toggle next to the \'Support DIM\' donation link in the header.',
                  '<p>Follow us on: <a style="margin: 0 5px;" href="http://destinyitemmanager.reddit.com" target="_blank"><img title="/r/DIM on Reddit" style="vertical-align: text-bottom;" src="images/reddit.png"></a> <a style="margin: 0 5px;" href="http://twitter.com/ThisIsDIM" target="_blank"><img style="vertical-align: text-bottom;" title="@ThisIsDIM on Twitter" src="images/twitter.png"></a>',
                  '<p><input style="margin-top: 1px; vertical-align: middle;" id="20160204Crimson" type="checkbox"> <label for="20160204Crimson">Hide This Popup</label></p>'
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
                  if($('#20160204Crimson')
                    .is(':checked')) {
                    chrome.storage.sync.set({
                      "2016.02.04-Crimson": 1
                    }, function(e) {});
                  }
                  if($('#20160204CrimsonTheme')
                    .is(':checked')) {
                    $('body')
                      .removeClass('crimson');
                    $(document)
                      .octoberLeaves('stop');
                    chrome.storage.sync.set({
                      "20160204CrimsonTheme": 1
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
        var currentImgSrcSanitizationWhitelist = $compileProvider.imgSrcSanitizationWhitelist();
        var newImgSrcSanitizationWhiteList = currentImgSrcSanitizationWhitelist.toString()
          .slice(0, -1) + '|chrome-extension:' + currentImgSrcSanitizationWhitelist.toString()
          .slice(-1);

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
    //   'DIM - Chrome Extension - v3.2.1',
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
