(function () {
  'use strict';

  angular.module('dimApp').directive('dimCharacter', Character);

  function Character($document) {
    return {
      bindToController: true,
      controller: CharacterCtrl,
      controllerAs: 'vm',
      link: Link,
      scope: {
        store: '=?dimCharacter'
      },
      template: [
        '<div class="character-box">',
          '<div class="emblem"></div>',
          '<div class="class">{{ vm.class }}</div>',
          '<div class="level" ng-show="vm.isCharacter">{{ vm.level }}</div>',
        '</div>',
        '<div class="loadout-button" ng-click="vm.LoadoutPopup($event)">&#x25BD;</div>'].join('')
    };

    function CharacterCtrl($scope) {
      var self = this;

      self.isCharacter = ($scope.vm.store.id !== 'vault');
      self.class = $scope.vm.store.class;
      self.level = $scope.vm.store.level;
      self.maxLevel = ($scope.vm.store.level >= 20);
      self.characterBoxUrl = 'http://bungie.net' + $scope.vm.store.background;
      self.emblemUrl = 'http://bungie.net' + $scope.vm.store.icon;
    }

    function Link(scope, element) {
      var vm = scope.vm;

      element.addClass('character');

      if (vm.isCharacter) {
    			element[0].querySelector('.character-box').style.backgroundImage = 'url(' + vm.characterBoxUrl + ')';
    			element[0].querySelector('.emblem').style.backgroundImage = 'url(' + vm.emblemUrl + ')';

          if (vm.maxLevel) {
            element[0].querySelector('.level').style.color = 'rgba(245, 220, 86, 1)';
          }
      }

      vm.LoadoutPopup = function LoadoutPopup() {
        var document = $document[0];
        var move = document.getElementById('move-popup');
        var loadout = document.getElementById('loadout-popup');

  			if (move.style.display !== 'none') {
  				move.style.display = 'none';
  			}

  			loadout.style.display = 'block';

  			element[0].querySelector('.loadout-button').appendChild(loadout);
      };
    }
  }
})();
