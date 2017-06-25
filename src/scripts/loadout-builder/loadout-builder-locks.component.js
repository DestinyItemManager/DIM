import angular from 'angular';
import _ from 'underscore';
import template from './loadout-builder-locks.html';
import dialogTemplate from './loadout-builder-locks-dialog.html';

export const LoadoutBuilderLocks = {
  controller: LoadoutBuilderLocksCtrl,
  controllerAs: 'vm',
  bindings: {
    lockedItems: '<',
    lockedPerks: '<',
    activePerks: '<',
    i18nItemNames: '<',
    lockedItemsValid: '&',
    onDrop: '&',
    onRemove: '&',
    getStore: '&',
    onPerkLocked: '&'
  },
  template: template
};

function LoadoutBuilderLocksCtrl($scope, ngDialog) {
  'ngInject';

  const vm = this;
  let dialogResult = null;
  let detailItemElement = null;

  $scope.$on('ngDialog.opened', (event, $dialog) => {
    if (dialogResult && $dialog[0].id === dialogResult.id) {
      $dialog.position({
        my: 'left-2 top-2',
        at: 'left top',
        of: detailItemElement,
        collision: 'flip flip',
        within: '.store-bounds'
      });
    }
  });

  angular.extend(vm, {
    getFirstPerk: function(lockedPerks, type) {
      return vm.lockedPerks[type][_.keys(vm.lockedPerks[type])[0]];
    },
    hasLockedPerks: function(lockedPerks, type) {
      return _.keys(lockedPerks[type]).length > 0;
    },
    addPerkClicked: function(perks, lockedPerks, type, e) {
      e.stopPropagation();
      if (dialogResult) {
        dialogResult.close();
      }

      detailItemElement = angular.element(e.currentTarget);

      dialogResult = ngDialog.open({
        template: dialogTemplate,
        overlay: false,
        className: 'perk-select-popup',
        showClose: false,
        scope: angular.extend($scope.$new(true), {}),
        controllerAs: 'vmd',
        controller: function($document) {
          'ngInject';
          const vmd = this;

          $document.keyup((e) => {
            if (vmd.shiftHeld) {
              $scope.$apply(() => {
                vmd.shiftHeld = e.shiftKey;
              });
            }
          });

          $document.keydown((e) => {
            if (vmd.shiftHeld === false && e.shiftKey) {
              $scope.$apply(() => {
                vmd.shiftHeld = e.shiftKey;
              });
            }
          });

          angular.extend(vmd, {
            perks: perks,
            lockedPerks: lockedPerks,
            shiftHeld: false,
            type: type,
            onPerkLocked: vm.onPerkLocked
          });
        },
        // Setting these focus options prevents the page from
        // jumping as dialogs are shown/hidden
        trapFocus: false,
        preserveFocus: false
      });
    },
    close: function() {
      if (dialogResult) {
        dialogResult.close();
      }
      $scope.closeThisDialog();
    }
  });
}

