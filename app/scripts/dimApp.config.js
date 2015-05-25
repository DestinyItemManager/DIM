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
        'ClassItem',
      ],
      General: [
        'Emblem',
        'Armor',
        'Ghost',
        'Ship',
        'Vehicle',
        'Consumable',
        'Material'
      ]
    });

  angular.module('dimApp')
    .run(function($rootScope, promiseTracker) {
      $rootScope.loadingTracker = promiseTracker();
    });

  angular.module('dimApp')
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
  if (verge.viewportW()	!== $(window).width()) {
    $('body').addClass('pad-margin');


      var style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = '.about.ngdialog-open.pad-margin #header, .support.ngdialog-open.pad-margin #header, .filters.ngdialog-open.pad-margin #header { padding-right: ' + (verge.viewportW()	- $(window).width()) + 'px; }';
      document.getElementsByTagName('head')[0].appendChild(style);
  }
});
