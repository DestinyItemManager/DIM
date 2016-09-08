(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreHeading', StoreHeading)
    .filter('firstLetter', function() {
      return function(str) {
        return str.substring(0, 1);
      };
    });

  function StoreHeading() {
    return {
      controller: StoreHeadingCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {
        store: '=storeData'
      },
      restrict: 'E',
      template: [
        '<div class="character-box" ng-style="{ \'background-image\': \'url(\' + vm.store.background + \')\' }">',
        '  <div class="emblem" ng-style="{ \'background-image\': \'url(\' + vm.store.icon + \')\' }"></div>',
        '  <div class="class">{{:: vm.store.className }}</div>',
        '  <div class="race-gender" ng-if="::!vm.store.isVault">{{:: vm.store.genderRace }}</div>',
        '  <div class="level" ng-if="::!vm.store.isVault"><span translate="Level"></span> {{ vm.store.level }}</div>',
        '  <div class="level powerLevel" ng-if="!vm.store.isVault">{{ vm.store.powerLevel }}</div>',
        '  <div class="currency" ng-if="::!!vm.store.isVault"> {{ vm.store.glimmer }} <img src="/images/glimmer.png"></div>',
        '  <div class="currency legendaryMarks" ng-if="::!!vm.store.isVault"> {{ vm.store.legendaryMarks }} <img src="/images/legendaryMarks.png"></div>',
        '  <div class="levelBar" ng-class="{ moteProgress: !vm.store.percentToNextLevel }" ng-if="::!vm.store.isVault" title="{{vm.xpTillMote}}">',
        '    <div class="barFill" dim-percent-width="vm.levelBar"></div>',
        '  </div>',
        '  <div class="loadout-button" ng-click="vm.openLoadoutPopup($event)"><i class="fa fa-chevron-down"></i></div>',
        '</div>',
        '<div class="loadout-menu" loadout-id="{{:: vm.store.id }}"></div>',
        '<dim-stats stats="vm.store.stats" ng-if="!vm.store.isVault"></dim-stats>',
        '<div ng-if="vm.store.isVault" class="vault-capacity">',
        '  <div class="vault-bucket" title="{{sort | translate}}: {{size}}/{{capacity}}" ng-repeat="(sort, size) in vm.store.vaultCounts" ng-init="capacity = vm.store.capacityForItem({sort: sort})">',
        '    <div class="vault-bucket-tag">{{sort | translate | firstLetter}}</div>',
        '    <div class="vault-fill-bar">',
        '      <div class="fill-bar" ng-class="{ \'vault-full\': size == capacity }" dim-percent-width="size / capacity"></div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  StoreHeadingCtrl.$inject = ['$scope', 'ngDialog'];

  function StoreHeadingCtrl($scope, ngDialog) {
    var vm = this;
    var dialogResult = null;

    function getLevelBar() {
      if (vm.store.percentToNextLevel) {
        return vm.store.percentToNextLevel;
      }
      if (vm.store.progression && vm.store.progression.progressions) {
        var prestige = _.findWhere(vm.store.progression.progressions, {
          progressionHash: 2030054750
        });
        vm.xpTillMote = 'Prestige level: ' + prestige.level + '\n' +
          (prestige.nextLevelAt - prestige.progressToNextLevel) +
          'xp until 5 motes of light';
        return prestige.progressToNextLevel / prestige.nextLevelAt;
      }
      return 0;
    }

    $scope.$watch([
      'store.percentToNextLevel',
      'store.progression.progressions'
    ], function() {
      vm.levelBar = getLevelBar();
    });

    vm.openLoadoutPopup = function openLoadoutPopup(e) {
      e.stopPropagation();

      if (dialogResult === null) {
        ngDialog.closeAll();

        dialogResult = ngDialog.open({
          template: '<div ng-click="$event.stopPropagation();" dim-click-anywhere-but-here="closeThisDialog()" dim-loadout-popup="vm.store"></div>',
          plain: true,
          appendTo: 'div[loadout-id="' + vm.store.id + '"]',
          overlay: false,
          className: 'loadout-popup',
          showClose: false,
          scope: $scope
        });

        dialogResult.closePromise.then(function() {
          dialogResult = null;
        });
      } else {
        dialogResult.close();
      }
    };
  }
})();
