/*jshint -W027*/

(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreHeading', StoreHeading);

  StoreHeading.$inject = ['ngDialog'];

  function StoreHeading(ngDialog) {
    return {
      controller: StoreHeadingCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {
        'store': '=storeData'
      },
      link: Link,
      template: [
        '<div class="character-box" ng-style="{ \'background-image\': \'url(\' + vm.store.background + \')\' }">',
        '  <div class="emblem" ng-style="{ \'background-image\': \'url(\' + vm.store.icon + \')\' }"></div>',
        '  <div class="class">{{:: vm.store.class || "Vault" }}</div>',
        '  <div class="race-gender" ng-if="::!vm.store.isVault">{{:: vm.store.race }} {{:: vm.store.gender }}</div>',
        '  <div class="level" ng-if="::!vm.store.isVault">Level {{ vm.store.level }}</div>',
        '  <div class="level powerLevel" ng-if="!vm.store.isVault">{{ vm.store.powerLevel }}</div>',
        '  <div class="currency" ng-if="::!!vm.store.isVault"> {{ vm.store.glimmer }} <img src="/images/glimmer.png"></div>',
        '  <div class="currency legendaryMarks" ng-if="::!!vm.store.isVault"> {{ vm.store.legendaryMarks }} <img src="/images/legendaryMarks.png"></div>',
        '  <div class="levelBar" ng-if="::!vm.store.isVault" title="{{vm.xpTillMote}}">',
        '    <div class="barFill" ng-style="vm.getLevelBar()"></div>',
        '  </div>',
        '  <div class="loadout-button" ng-click="vm.openLoadoutPopup($event)"><i class="fa fa-chevron-down"></i></div>',
        '</div>',
        '<div class="loadout-menu" loadout-id="{{:: vm.store.id }}"></div>',
        '<dim-stats stats="vm.store.stats" ng-if="!vm.store.isVault"></dim-stats>',
        '<div ng-if="vm.store.isVault" class="vault-capacity">',
        '  <div class="vault-bucket" title="{{sort}}: {{size}}/{{capacity}}" ng-repeat="(sort, size) in vm.sortSize" ng-init="capacity = vm.store.capacityForItem({sort: sort})">',
        '    <div class="vault-bucket-tag">{{sort.substring(0,1)}}</div>',
        '    <div class="vault-fill-bar">',
        '      <div class="fill-bar" ng-class="{ \'vault-full\': size == capacity }" ng-style="{ width: 100 * (size / capacity) + \'%\' }"></div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };

    function Link(scope, element) {
      var vm = scope.vm;
      $(document).ready(function() {
        element.scrollToFixed({
          marginTop: 61,
          fixed: function() {
            $(document.body).addClass('something-is-sticky');
            $(this).addClass('fixed-header');
          },
          unfixed: function() {
            $(document.body).removeClass('something-is-sticky');
            $(this).removeClass('fixed-header');
          }
        });
      });
    }
  }

  StoreHeadingCtrl.$inject = ['$scope', 'ngDialog'];

  function StoreHeadingCtrl($scope, ngDialog) {
    var vm = this;
    var dialogResult = null;

    vm.sortSize = {};
    if (vm.store.isVault) {
      $scope.$watchCollection('vm.store.items', function() {
        ['Weapons', 'Armor', 'General'].forEach(function(sort) {
          vm.sortSize[sort] = count(vm.store.items, {sort: sort});
        });
      });
    }

    vm.getLevelBar = function getLevelBar() {
        if(vm.store.percentToNextLevel) {
          return {width: vm.store.percentToNextLevel + '%'};
        }
        if(vm.store.progression && vm.store.progression.progressions) {
          var prestige = _.findWhere(vm.store.progression.progressions, {progressionHash: 2030054750});
          vm.xpTillMote = 'Prestige level: ' + prestige.level + '\n' +
                          (25000-prestige.progressToNextLevel) + 'xp until 5 motes of light';
          return {width: (prestige.progressToNextLevel)/250 + '%', "background-color": '#00aae1', opacity: .9};
        }
        return '';
      };

    vm.openLoadoutPopup = function openLoadoutPopup(e) {
      e.stopPropagation();

      if (!_.isNull(dialogResult)) {
        dialogResult.close();
      } else {
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

        dialogResult.closePromise.then(function(data) {
          dialogResult = null;
        });
      }
      };
  }
})();
