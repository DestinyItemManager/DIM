(function () {
  'use strict';

  angular.module('dimApp').directive('dimEquipped', Equipped);

  function Equipped($document) {
    return {
      bindToController: true,
      controller: EquippedCtrl,
      controllerAs: 'vm',
      link: Link,
      replace: true,
      scope: {
        store: '=?dimEquipped'
      },
      template: [
        '<div>',
          '<div class="hover"></div>',
          '<div class="title">Equipped</div>',
          '<div class="items sections" data-type="equip" data-character="{{ vm.id }}" ng-show="vm.isCharacter">',
            '<span ng-repeat="item in vm.store.items | filter:{ equipped : true } | filter:{ equipment : true }" class="sort-{{ item.type.toLowerCase() }}">',
              '<span class="item{{ item.complete ? \' complete\' : \'\' }}" data-index="" data-name="{{ item.name }}" data-instance-id="{{ item.id }}"><img draggable="true" ng-src="{{ \'http://bungie.net/\' + item.icon }}"><div class="stack" ng-if="item.amount > 1">{{ item.amount }}</div></span>',
            '</span>',
          '</div>',
        '</div>'].join('')
    };

    function EquippedCtrl($scope) {
      var self = this;

      self.id = $scope.vm.store.id;
      self.isCharacter = ($scope.vm.store.id !== 'vault');

      // self.isCharacter = ($scope.store.id !== 'vault');
      // self.level = $scope.store.level;
      // self.maxLevel = ($scope.store.level >= 20);
      // self.characterBoxUrl = 'http://bungie.net' + $scope.store.background;
      // self.emblemUrl = 'http://bungie.net' + $scope.store.icon;
    }

    function Link(scope, element) {
      var vm = scope.vm;

      // element.addClass('character');
      //
      // if (vm.isCharacter) {
    	// 		element[0].querySelector('.character-box').style.backgroundImage = 'url(' + vm.characterBoxUrl + ')';
    	// 		element[0].querySelector('.emblem').style.backgroundImage = 'url(' + vm.emblemUrl + ')';
      //
      //     if (vm.maxLevel) {
      //       element[0].querySelector('.level').style.color = 'rgba(245, 220, 86, 1)';
      //     }
      // }
      //
      // vm.LoadoutPopup = function LoadoutPopup() {
      //   var document = $document[0];
      //   var move = document.getElementById('move-popup');
      //   var loadout = document.getElementById('loadout-popup');
      //
  		// 	if (move.style.display !== 'none') {
  		// 		move.style.display = 'none';
  		// 	}
      //
  		// 	loadout.style.display = 'block';
      //
  		// 	element[0].querySelector('.loadout-button').appendChild(loadout);
      // };
    }
  }
})();
