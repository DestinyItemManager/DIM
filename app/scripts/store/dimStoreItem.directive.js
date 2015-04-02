/*jshint -W027*/

(function () {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreItem', StoreItem);

  StoreItem.$inject = ['dimStoreService', 'ngDialog'];

  function StoreItem(dimStoreService, ngDialog) {
    return {
      bindToController: true,
      controller: StoreItemCtrl,
      controllerAs: 'vm',
      link: Link,
      replace: true,
      scope: {
        'store': '=storeData',
        'item': '=itemData'
      },
      template: [
        '<div ui-draggable="true" id="item-{{:: $id }}" drag-channel="{{ vm.item.type }}" drag="\'item-\' + $id" ng-show="vm.item.visible" class="item" ng-class="{ \'complete\': vm.item.complete}">',
        '  <img ui-draggable="false" ng-src="http://bungie.net/{{ vm.item.icon }}" ng-click="vm.openPopup(vm.item, $event)">',
        '  <div ui-draggable="false" class="counter" ng-if="vm.item.amount > 1">{{ vm.item.amount }}</div>',
        '  <div ui-draggable="false" class="damage-type" ng-if="vm.item.sort === \'Weapons\'" ng-class="\'damage-\' + vm.item.dmg"></div>',
        '</div>'
      ].join('')
    };

    function Link(scope, element, attrs) {
      var vm = scope.vm;
      var dialogResult = null;

      vm.openPopup = function openPopup(item, e) {
        e.stopPropagation();

        if (!_.isNull(dialogResult)) {
          dialogResult.close();
        } else {
          ngDialog.closeAll();

          dialogResult = ngDialog.open({
            template: '<div ng-click="$event.stopPropagation();" dim-click-anywhere-but-here="vm.closePopup()" dim-move-popup dim-store="vm.store" dim-item="vm.item"></div>',
            plain: true,
            appendTo: 'div[id="item-' + scope.$id + '"]',
            overlay: false,
            className: 'move-popup' + (((element[0].offsetLeft + 320) >= document.documentElement.clientWidth) ? ' move-popup-right' : ''),
            showClose: false,
            scope: scope
          });

          dialogResult.closePromise.then(function (data) {
            dialogResult = null;
          });
        }
      };

      vm.closePopup = function closePopup() {
        if (!_.isNull(dialogResult)) {
          dialogResult.close();
        }
      };
    }
  }

  StoreItemCtrl.$inject = ['$scope'];

  function StoreItemCtrl($scope) {
    var vm = this;
  }
})();
