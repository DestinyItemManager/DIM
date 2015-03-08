(function() {
  'use strict';

  angular.module('dimApp').directive('dimMovePopup', MovePopup);

  function MovePopup($window) {
    return {
      controller: MovePopupController,
      controllerAs: 'mp',
      bindToController: true,
      link: Link,
      restrict: 'A',
      scope: {
        vm: '=dimMovePopup'
      },
      replace: true,
      template: [
        '<div id="move-popup">',
          '<div dim-move-item-properties="mp.item"></div>',
          '<div class="locations" ng-repeat="store in mp.vm.data.stores">',
            '<div class="move-button move-vault" data-type="item" data-character="{{ store.id }}" ng-if="!mp.isGuardian" ng-click="MoveToVault(store, $event)">',
              '<span>Vault</span>',
            '</div>',
            '<div class="move-button move-store" data-type="item" data-character="{{ store.id }}" style="background-image: url(http://bungie.net{{ store.icon }})" ng-if="mp.isGuardian" ng-click="MoveToGuardian(store, $event)">',
              '<span>Store</span>',
            '</div>',
            '<div class="move-button move-equip" data-type="equip" data-character="{{ store.id }}" style="background-image: url(http://bungie.net{{ store.icon }})" ng-if="mp.isGuardian" ng-click="MoveToEquip(store, $event)">',
              '<span>Equip</span>',
            '</div>',
          '</div>',
        '</div>'].join('')
    }
  }

  function MovePopupController($scope) {
    var vm = this;

    // vm.showPopup = false;
    //
    // $scope.$on('show-popup', function(e, arg) {
    //   vm.showPopup = arg.showPopup;
    //   vm.item = arg.item;
    // });
    //
    // angular.forEach($scope.mp.vm.data.stores, function(storage) {
    //   storage.isGuardian = (storage.class !== 'vault');
    // });
  }

  function Link(scope, element, attrs) {

    scope.MoveToVault = function MoveToVault(store, e) {
      var data = e.srcElement.dataset;
      var item = $window._items[_transfer.dataset.index];

      $window.moveItem(item, data, 1, function() {
        $window.manageItemClick(item, data);
      });
    };

    scope.$on('show-popup', function(e, arg) {

      if (scope.mp.item.hash !== arg.item.hash) {
        element[0].style.removeProperty('display');
        element[0].style.setProperty('display', 'block');
        scope.showPopup = true;
      } else {
        if (scope.showPopup) {
          element[0].style.removeProperty('display');
          scope.showPopup = false;
        } else {
          element[0].style.removeProperty('display');
          element[0].style.setProperty('display', 'block');
          scope.showPopup = true;
        }
      }
    });

    scope.MoveToGuardian = scope.MoveToEquip = scope.MoveToVault;
  }
})();
