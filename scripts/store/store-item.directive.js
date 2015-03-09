(function () {
  'use strict';

  angular.module('dimApp')
    .directive('dimStoreItem', StoreItem);

  StoreItem.$inject = ['ngDialog'];

  function StoreItem(ngDialog) {
    return {
      bindToController: true,
      controller: StoreItemCtrl,
      controllerAs: 'vm',
      replace: true,
      scope: {
        'store': '=storeData',
        'item': '=itemData'
      },
      template: [
        '<div ui-draggable="true" class="item{{ vm.item.complete ? \' complete\' : \'\' }}" data-instance-id="{{ vm.item.id }}" ng-click="vm.openLoadout(vm.item, $event)">',
        '  <img ui-draggable="false" ng-drag="false" ng-src="http://bungie.net/{{ vm.item.icon }}">',
        '  <div class="stack" ng-if="vm.item.amount > 1">{{ vm.item.amount }}</div>',
        '</div>'
      ].join('')
    };

    StoreItemCtrl.$inject = ['$scope', 'dimStoreService'];

    function StoreItemCtrl($scope, dimStoreService) {
      var vm = this;
      var dialogResult = null;

      vm.openLoadout = function openLoadout(item, e) {
        e.stopPropagation();

        if (!_.isNull(dialogResult)) {
          dialogResult.close();
        } else {
          ngDialog.closeAll();

          dialogResult = ngDialog.open({
            template: '<div dim-move-popup dim-store="vm.store" dim-item="vm.item"></div>',
            plain: true,
            appendTo: 'div[data-instance-id="' + item.id + '"]',
            overlay: false,
            className: 'move-popup',
            showClose: false,
            scope: $scope
          });

          dialogResult.closePromise.then(function (data) {
            dialogResult = null;
          });
        }
      };
    }
  }
})();
