import angular from 'angular';

angular.module('dimApp')
  .directive('dimMovePopup', MovePopup);

function MovePopup() {
  return {
    controller: MovePopupController,
    controllerAs: 'vm',
    bindToController: true,
    restrict: 'A',
    scope: {
      store: '=dimStore',
      item: '=dimItem'
    },
    replace: true,
    template: [
      '<div class="move-popup" alt="" title="">',
      '  <div dim-move-item-properties="vm.item" dim-infuse="vm.infuse" change-details="vm.reposition()"></div>',
      '  <dim-move-amount ng-if="vm.maximum > 1 && !vm.item.notransfer" amount="vm.moveAmount" maximum="vm.maximum" max-stack-size="vm.item.maxStackSize"></dim-move-amount>',
      '  <div class="interaction">',
      '    <div class="locations" ng-repeat="store in vm.stores | sortStores:vm.settings.characterOrder track by store.id">',
      '      <div class="move-button move-vault" alt="{{::store.name}}" title="{{::store.name}}" ',
      '        ng-if="vm.canShowVault(vm.item, vm.store, store)" ng-click="vm.moveItemTo(store)" ',
      '        data-type="item" data-character="{{::store.id}}">',
      '        <span translate="MovePopup.Vault"></span>',
      '      </div>',
      '      <div class="move-button move-equip" alt="{{::store.name}}" title="{{::store.name}}" ',
      '        ng-if="!(vm.item.owner == store.id && vm.item.equipped) && vm.item.canBeEquippedBy(store)" ng-click="vm.moveItemTo(store, true)" ',
      '        data-type="equip" data-character="{{::store.id}}" style="background-image: url({{::store.icon}})">',
      '        <span translate="MovePopup.Equip"></span>',
      '      </div>',
      '      <div class="move-button move-store" alt="{{::store.name}}" title="{{::store.name}}" ',
      '        ng-if="vm.canShowStore(vm.item, vm.store, store)" ng-click="vm.moveItemTo(store)" ',
      '        data-type="item" data-character="{{::store.id}}" style="background-image: url({{::store.icon}})"> ',
      '        <span translate="MovePopup.Store"></span>',
      '      </div>',
      '    </div>',
      '    <div class="move-button move-consolidate" translate-attr="{ alt: \'MovePopup.Consolidate\', title:\'MovePopup.Consolidate\' }"',
      '      ng-if="!vm.item.notransfer && vm.item.maxStackSize > 1" ng-click="vm.consolidate()">',
      '      <span translate="MovePopup.Take"></span>',
      '    </div>',
      '    <div class="move-button move-distribute" translate-attr="{ alt: \'MovePopup.DistributeEvenly\', title: \'MovePopup.DistributeEvenly\' }" ',
      '      ng-if="!vm.item.notransfer && vm.item.maxStackSize > 1" ng-click="vm.distribute()">',
      '      <span translate="MovePopup.Split"></span>',
      '    </div>',
      '  <div class="locations">',
      '    <div class="move-button infuse-perk" ng-if="vm.item.talentGrid.infusable" ng-click="vm.infuse(vm.item, $event)" translate-attr="{ title: \'Infusion\', alt: \'Infusion.Calc\' }" ng-class="vm.item.bucket.sort"></div>',
      '  </div>',
      '  </div>',
      '</div>'
    ].join('')
  };
}


function MovePopupController($scope, dimStoreService, ngDialog, $timeout, dimSettingsService, dimItemMoveService) {
  var vm = this;
  vm.moveAmount = vm.item.amount;
  vm.settings = dimSettingsService;

  if (vm.item.maxStackSize > 1) {
    var store = dimStoreService.getStore(vm.item.owner);
    vm.maximum = store.amountOfItem(vm.item);
  }

  var shown = false;

  // Capture the dialog element
  var dialog = null;
  $scope.$on('ngDialog.opened', function(event, $dialog) {
    dialog = $dialog;
    vm.reposition();
  });

  // Reposition the popup as it is shown or if its size changes
  vm.reposition = function() {
    var element = $scope.$parent.ngDialogData;
    if (element) {
      if (!shown) {
        dialog.hide();
      }
      shown = true;
      $timeout(function() {
        dialog
          .position({
            my: 'left bottom',
            at: 'left top-2',
            of: element,
            collision: 'flip flip',
            within: '.store-bounds'
          })
          .show();
      });
    }
  };

  /*
  * Open up the dialog for infusion by passing
  * the selected item
  */
  vm.infuse = function infuse(item, e) {
    e.stopPropagation();

    // Close the move-popup
    $scope.$parent.closeThisDialog();

    // Open the infuse window
    ngDialog.open({
      template: require('app/views/infuse.template.html'),
      className: 'app-settings',
      appendClassName: 'modal-dialog',
      data: item
    });
  };

  function closeThisDialog() {
    $scope.$parent.closeThisDialog();
  }

  vm.consolidate = function() {
    dimItemMoveService.consolidate(vm.item, vm.store, closeThisDialog);
  };

  vm.distribute = function() {
    dimItemMoveService.distribute(vm.item, vm.store, closeThisDialog);
  };

  vm.moveItemTo = function(store, equip) {
    dimItemMoveService.moveItemTo(vm.item, store, equip, vm.moveAmount, closeThisDialog);
  };

  vm.stores = dimStoreService.getStores();

  vm.canShowVault = function canShowButton(item, itemStore, buttonStore) {
    // If my itemStore is the vault, don't show a vault button.
    // Can't vault a vaulted item.
    if (itemStore.isVault) {
      return false;
    }

    // If my buttonStore is the vault, then show a vault button.
    if (!buttonStore.isVault) {
      return false;
    }

    // Can't move this item away from the current itemStore.
    if (item.notransfer) {
      return false;
    }

    return true;
  };

  vm.canShowStore = function canShowButton(item, itemStore, buttonStore) {
    if (buttonStore.isVault) {
      return false;
    }

    if (item.notransfer) {
      if (item.equipped && itemStore.id === buttonStore.id) {
        return true;
      }
    } else if (itemStore.id !== buttonStore.id || item.equipped) {
      return true;
    }

    return false;
  };
}

