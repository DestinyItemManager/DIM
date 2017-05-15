import template from './loadout-builder-character-select.html';
import dialogTemplate from './loadout-builder-character-select-dialog.html';

export const LoadoutBuilderCharacterSelect = {
  controller: LoadoutBuilderCharacterSelectCtrl,
  controllerAs: 'vm',
  bindings: {
    activeCharacters: '<',
    selectedCharacter: '=',
    onSelectedChange: '&'
  },
  template: template
};

function LoadoutBuilderCharacterSelectCtrl($scope, ngDialog) {
  'ngInject';

  var vm = this;
  var dialogResult = null;

  vm.onSelected = function onSelected(idx) {
    if (vm.selectedCharacter !== idx) {
      var prev = vm.selectedCharacter;
      vm.selectedCharacter = idx;
      vm.onSelectedChange({ prev: prev, new: idx });
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

      dialogResult.closePromise.then(function() {
        dialogResult = null;
      });
    } else {
      dialogResult.close();
    }
  };
}
