(function () {
  'use strict';

  angular.module('dimApp').directive('dimStoreItem', StoreItem);

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
        '<div class="item{{ vm.item.complete ? \' complete\' : \'\' }}" data-index="{{ vm.item.index }}" data-name="{{ vm.item.name }}" data-instance-id="{{ vm.item.id }}">',
          '<img draggable="true" ng-src="http://bungie.net/{{ vm.item.icon }}" ng-click="vm.openLoadout(vm.item, $event)">',
          '<div class="stack" ng-if="vm.item.amount > 1">{{ vm.item.amount }}</div>',
        '</div>'].join('')
    };

    StoreItemCtrl.$inject = ['$scope', 'dimStoreService'];

    function StoreItemCtrl($scope, dimStoreService) {
      var vm = this;
      var dialogResult = null;

      vm.openLoadout = function openLoadout(item, e) {
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

          dialogResult.closePromise.then(function(data) {
            dialogResult = null;
          });
        }
      };
    }
  }
})();
