(function () {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreHeading', StoreHeading);

  function StoreHeading() {
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
        '<div class="loadout-button" ng-show="vm.isGuardian">&#x25BC;</div>'
      ].join('')
    };

    function StoreHeadingCtrl() {
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

    function Link(scope, element) {
      var vm = scope.vm;

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
})();
