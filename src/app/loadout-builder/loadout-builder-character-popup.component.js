import template from './loadout-builder-character-popup.html';

export const LoadoutBuilderCharacterPopup = {
  controllerAs: 'vm',
  bindings: {
    activeCharacters: '<',
    selectedCharacter: '=',
    onSelected: '&'
  },
  template: template
};

