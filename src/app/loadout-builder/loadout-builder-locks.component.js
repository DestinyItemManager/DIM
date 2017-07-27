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

      dialogResult = ngDialog.open({
        template: dialogTemplate,
        overlay: false,
        className: 'perk-select-popup',
        showClose: false,
        appendTo: `#locked-perks-${type}`,
        scope: angular.extend($scope.$new(true), {}),
        controllerAs: 'vmd',
        controller: function($document, $scope) {
          'ngInject';
          const vmd = this;

          function keyup(e) {
            console.log('keyup');
            if (vmd.shiftHeld) {
              $scope.$apply(() => {
                vmd.shiftHeld = e.shiftKey;
              });
            }
          }
          $document.on('keyup', keyup);

          function keydown(e) {
            if (vmd.shiftHeld === false && e.shiftKey) {
              $scope.$apply(() => {
                vmd.shiftHeld = e.shiftKey;
              });
            }
          }
          $document.on('keydown', keydown);

          $scope.$on('$destroy', () => {
            $document.off('keyup', keyup);
            $document.off('keyup', keydown);
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

