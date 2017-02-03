import templateUrl from './platform-choice.html';
import './platform-choice.scss';

const platformChoiceComponent = {
  bindings: {
    current: '<',
    selected: '&',
    platforms: '<'
  },
  templateUrl,
  controllerAs: 'platformChoiceCtrl'
};

export default platformChoiceComponent