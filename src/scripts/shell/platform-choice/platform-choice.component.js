import templateUrl from './platform-choice.html';
import './platform-choice.scss';

export const PlatformChoiceComponent = {
  bindings: {
    current: '<',
    selected: '&',
    platforms: '<'
  },
  templateUrl,
  controllerAs: 'platformChoiceCtrl'
};