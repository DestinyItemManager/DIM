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
        '<div class="character-box" ng-class="::{ \'vault-box\': !vm.isGuardian }" ng-style="{ \'background-image\': \'url(http://bungie.net\' + vm.store.background + \')\' }">',
        '  <div class="emblem" ng-if="::vm.isGuardian" ng-style="{ \'background-image\': \'url(http://bungie.net\' + vm.store.icon + \')\' }"></div>',
        '  <div class="class">{{::vm.store.class}}</div>',
        '  <div class="race-gender" ng-if="::vm.isGuardian">{{:: vm.store.race }} {{:: vm.store.gender }}</div>',
        '  <div class="level" ng-if="::vm.isGuardian">Level {{ vm.store.level }}</div>',
        '  <div class="level powerLevel" ng-if="vm.isGuardian">{{ vm.store.powerLevel }}</div>',
        '  <div class="currency" ng-if="::!vm.isGuardian"> {{ vm.store.glimmer }} <img src="/images/glimmer.png"></div>',
        '  <div class="currency legendaryMarks" ng-if="::!vm.isGuardian"> {{ vm.store.legendaryMarks }} <img src="/images/legendaryMarks.png"></div>',
        '  <div class="levelBar" ng-if="::vm.isGuardian" title="{{vm.xpTillMote}}">',
        '    <div class="barFill" ng-style="vm.getLevelBar()"></div>',
        '  </div>',
        '  <div class="loadout-button" ng-if="::vm.isGuardian" ng-click="vm.openLoadoutPopup($event)"><i class="fa fa-chevron-down"></i></div>',
        '</div>',
        '<div class="loadout-menu" loadout-id="{{:: vm.store.id }}"></div>',
        '<div dim-stats stats="vm.store.stats" ng-if="vm.isGuardian"></div>',
        '</div>'
      ].join('')
    };

    function Link(scope, element) {
      var vm = scope.vm;
      var dialogResult = null;

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
            scope: scope
          });

          dialogResult.closePromise.then(function(data) {
            dialogResult = null;
          });
        }
      };

      element.addClass('character');
    }
  }

  StoreHeadingCtrl.$inject = ['$scope'];

  function StoreHeadingCtrl($scope) {
    var vm = this;
    vm.isGuardian = !vm.store.isVault;
  }
})();
