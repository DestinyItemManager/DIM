import template from './loadout-builder-character-popup.html';
import { IComponentOptions } from 'angular';

export const LoadoutBuilderCharacterPopup: IComponentOptions = {
  controllerAs: 'vm',
  bindings: {
    activeCharacters: '<',
    selectedCharacter: '=',
    onSelected: '&'
  },
  template
};
