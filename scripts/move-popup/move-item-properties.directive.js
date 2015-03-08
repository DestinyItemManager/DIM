(function() {
  'use strict';

  angular.module('dimApp').directive('dimStoreItemProperties', StoreItemProperties);

  function StoreItemProperties() {
    return {
      controller: StoreItemPropertiesController,
      controllerAs: 'vm',
      bindToController: true,
      link: Link,
      restrict: 'A',
      scope: {
        item: '=dimItemProperties'
      },
      template: [
        '<div class="item-name" ng-bind-html="vm.title"></div>'
      ].join('')
    };
  }

  function StoreItemPropertiesController($scope, $sce) {
    var vm = this;

    vm.title = $sce.trustAsHtml('');

    $scope.$watch('vm.item', function(item) {
      if (!_.isUndefined(item)) {
        vm.hasPrimaryStat = !_.isUndefined(item.primStat);
        vm.hasDefense = vm.hasPrimaryStat && (item.primStat.statHash === 3897883278);
        vm.hasAttack = vm.hasPrimaryStat && (item.primStat.statHash === 368428387);

        vm.title = $sce.trustAsHtml(item.name);

        if (vm.hasDefense) {
          if (item.stats.length === 4) {
            vm.title = $sce.trustAsHtml(vm.title + ' &#10022; ' + item.stats[0].value);
          }
        }
      }
    });


	// var name = move.querySelector('.item-name')
	// var moveItem = _items[item.dataset.index];
	//
  //   if (moveItem.primStat) {
	// 	if (moveItem.primStat.statHash === 3897883278) {
	// 		// This item has defense stats, so lets pull some useful armor stats
	// 		name.innerHTML = moveItem.name;
	//
	// 		// only 4 stats if there is a light element. other armor has only 3 stats.
	// 		if(moveItem.stats.length === 4) {
	// 			name.innerHTML += ' &#10022;' + moveItem.stats[0].value;
	// 		}
	// 		var stats = ['Int:', 'Dis:', 'Str:'];
	// 		var val = 0;
	// 		for(var s = 0; s < stats.length; s++) {
	// 			val = moveItem.stats[s + (moveItem.stats.length === 4 ? 1 : 0)].value;
	// 			if(val !== 0) {
	// 				name.innerHTML += ' | ' + stats[s] + ' ' + val;
	// 			}
	// 		}
	// 	} else if (moveItem.primStat.statHash === 368428387) {
	// 		// This item has attack stats, so lets pull some useful weapon stats
	// 		var attack = moveItem.primStat.value;
	// 		var damage = 'Kinetic';
	// 		var color = 'rgba(245,245,245,1)';
	//
	// 		switch(moveItem.dmgType) {
	// 			case 2: damage = 'arc'; color = '#85c5ec'; break;
	// 			case 3: damage = 'solar'; color = '#f2721b';  break;
	// 			case 4: damage = 'void'; color = '#b184c5'; break;
	// 		}
	//
	// 		name.innerHTML = '<img class="elemental ' + damage + '" src="assets/' + damage + '.png" />' +
	// 		 	moveItem.name + ' | A: ' + attack + ' ';
	// 		name.style.backgroundColor = color;
	// 	} else {
	// 		name.innerHTML = _items[item.dataset.index].name;
	// 	}
  //   } else {
	// 	name.innerHTML = _items[item.dataset.index].name;
	// }

  }

  function Link(scope, element, attrs) {

  }
})();
