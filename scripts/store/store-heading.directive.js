(function () {
  'use strict';

  angular.module('dimApp').directive('dimStoreHeading', StoreHeading);

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
        '<div class="character-box">',
          '<div class="emblem"></div>',
          '<div class="class">{{ vm.class }}</div>',
          '<div class="level" ng-show="vm.isGuardian">{{ vm.level }}</div>',
        '</div>',
        '<div class="loadout-button">&#x25BD;</div>'].join('')
    };

    function StoreHeadingCtrl() {
      var vm = this;

      vm.isGuardian = (vm.store.id !== 'vault');
      vm.class = vm.store.class;
      vm.level = vm.store.level;
      vm.maxLevel = (vm.store.level >= 20);
      vm.characterBoxUrl = 'http://bungie.net' + vm.store.background;
      vm.emblemUrl = 'http://bungie.net' + vm.store.icon;
    }

    function Link(scope, element) {
      var vm = scope.vm;

      element.addClass('character');

      if (vm.isGuardian) {
    			element[0].querySelector('.character-box').style.backgroundImage = 'url(' + vm.characterBoxUrl + ')';
    			element[0].querySelector('.emblem').style.backgroundImage = 'url(' + vm.emblemUrl + ')';

          if (vm.maxLevel) {
            element[0].querySelector('.level').classList.add('maxLevel');
          }
      }
    }
  }
})();
