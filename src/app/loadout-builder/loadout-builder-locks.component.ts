import { IComponentOptions } from 'angular';
import * as _ from 'lodash';
import template from './loadout-builder-locks.html';
import dialogTemplate from './loadout-builder-locks-dialog.html';

export const LoadoutBuilderLocks: IComponentOptions = {
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
  template
};

function LoadoutBuilderLocksCtrl($scope, ngDialog) {
  'ngInject';

  const vm = this;
  let dialogResult: any = null;

  Object.assign(vm, {
    getFirstPerk(lockedPerks, type) {
      return lockedPerks[type][_.keys(lockedPerks[type])[0]];
    },
    hasLockedPerks(lockedPerks, type) {
      return _.keys(lockedPerks[type]).length > 0;
    },
    addPerkClicked(perks, lockedPerks, type, e) {
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
        scope: $scope.$new(true),
        controllerAs: 'vmd',
        controller($document, $scope) {
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

          Object.assign(vmd, {
            perks,
            lockedPerks,
            shiftHeld: false,
            type,
            onPerkLocked: vm.onPerkLocked
          });
        },
        // Setting these focus options prevents the page from
        // jumping as dialogs are shown/hidden
        trapFocus: false,
        preserveFocus: false
      });
    },
    close() {
      if (dialogResult) {
        dialogResult.close();
      }
      $scope.closeThisDialog();
    }
  });
}
