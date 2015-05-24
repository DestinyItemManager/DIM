/*jshint -W027*/

(function () {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreHeading', StoreHeading);

  StoreHeading.$inject = ['ngDialog', 'dimEngramFarmingService'];

  function StoreHeading(ngDialog, dimEngramFarmingService) {
    return {
      controller: StoreHeadingCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {
        'store': '=storeData'
      },
      link: Link,
      template: [
        '<div class="character-box" ng-class="vm.isGuardian ? \'\' : \'vault-box\'">',
        '  <div class="emblem" ng-show="vm.isGuardian"></div>',
        '  <div class="class">{{ vm.class || "Vault" }}</div>',
        '  <div class="race-gender" ng-show="vm.isGuardian">{{ vm.race }} {{ vm.gender }}</div>',
        '  <div class="level" ng-show="vm.isGuardian" ng-class="vm.isPrestigeLevel ? \'prestige\' : \'\'">{{ vm.level }}</div>',
        '  <div class="levelBar" ng-show="vm.isGuardian">',
        '    <div class="barFill" ng-class="vm.isPrestigeLevel ? \'prestige\' : \'\'" ng-style="{width: vm.percentToNextLevel + \'%\'}"></div>',
        '  </div>',
        '</div>',
        '<div class="guardian-popup-button" ng-show="vm.isGuardian" ng-click="vm.openGuardianPopup($event)">&#x25BC;</div>',
        '<div loadout-id="{{ vm.store.id }}" style="position: relative;"></div>'
      ].join('')
    };

    function Link(scope, element) {
      var vm = scope.vm;
      var dialogResult = null;

      vm.openGuardianPopup = function openGuardianPopup(e) {
        e.stopPropagation();

        if (!_.isNull(dialogResult)) {
          dialogResult.close();
        } else {
          ngDialog.closeAll();

          dialogResult = ngDialog.open({
            template: [
              '<div ng-click="$event.stopPropagation();" dim-class="vm[\'class\']" dim-click-anywhere-but-here="vm.closeLoadoutPopup()">',
              '  <div dim-loadout-popup="vm.store"></div>',
              '  <div class="engram-farming-popup"><label><input ng-show="vm.isGuardian" type="checkbox" ng-checked="vm.farmingEnabled()" ng-click="vm.toggleFarming()">Engram Farming</label></div>',
              '</div>'
            ].join(''),
            plain: true,
            appendTo: 'div[loadout-id="' + vm.store.id + '"]',
            overlay: false,
            className: 'loadout-popup',
            showClose: false,
            scope: scope
          });

          dialogResult.closePromise.then(function (data) {
            dialogResult = null;
          });
        }
      };

      vm.closeLoadoutPopup = function closeLoadoutPopup() {
        if (!_.isNull(dialogResult)) {
          dialogResult.close();
        }
      };

      vm.farmingEnabled = function() {
        return dimEngramFarmingService.farmingEnabledFor(vm.store.id);
      };

      vm.toggleFarming = function() {
        dimEngramFarmingService.toggleFarmingFor(vm.store.id);
      };

      element.addClass('character');

      if (vm.isGuardian) {
        element[0].querySelector('.character-box')
          .style.backgroundImage = 'url(' + vm.characterBoxUrl + ')';
        element[0].querySelector('.emblem')
          .style.backgroundImage = 'url(' + vm.emblemUrl + ')';

        if (vm.maxLevel) {
          element[0].querySelector('.level')
            .classList.add('maxLevel');
        }
      }
    }
  }

  StoreHeadingCtrl.$inject = [ 'dimEngramFarmingService' ];

  function StoreHeadingCtrl(dimEngramFarmingService) {
    var vm = this;

    vm.isGuardian = (vm.store.id !== 'vault');
    vm.class = vm.store.class;
    vm.level = vm.store.level;
    vm.race = vm.store.race;
    vm.gender = vm.store.gender;
    vm.isPrestigeLevel = vm.store.isPrestigeLevel;
    vm.percentToNextLevel = vm.store.percentToNextLevel;
    vm.maxLevel = (vm.store.level >= 20);
    vm.characterBoxUrl = 'http://bungie.net' + vm.store.background;
    vm.emblemUrl = 'http://bungie.net' + vm.store.icon;
  }
})();
