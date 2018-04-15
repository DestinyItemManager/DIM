import template from './loadout-builder-character-select.html';
import dialogTemplate from './loadout-builder-character-select-dialog.html';
import { IComponentOptions, IController } from 'angular';

export const LoadoutBuilderCharacterSelect: IComponentOptions = {
  controller: LoadoutBuilderCharacterSelectCtrl,
  controllerAs: 'vm',
  bindings: {
    activeCharacters: '<',
    selectedCharacter: '=',
    onSelectedChange: '&'
  },
  template
};

function LoadoutBuilderCharacterSelectCtrl(this: IController, $scope, ngDialog) {
  'ngInject';

  const vm = this;
  let dialogResult: any = null;

  vm.onSelected = function onSelected(idx) {
    if (vm.selectedCharacter !== idx) {
      const prev = vm.selectedCharacter;
      vm.selectedCharacter = idx;
      vm.onSelectedChange({ prev, new: idx });
    }
    ngDialog.closeAll();
  };

  vm.openCharSelectPopup = function openCharSelectPopup(e) {
    e.stopPropagation();

    if (dialogResult === null) {
      ngDialog.closeAll();

      dialogResult = ngDialog.open({
        template: dialogTemplate,
        appendTo: 'div[id="char-select"]',
        overlay: false,
        className: 'char-popup',
        showClose: false,
        scope: $scope
      });

      dialogResult.closePromise.then(() => {
        dialogResult = null;
      });
    } else {
      dialogResult.close();
    }
  };
}
