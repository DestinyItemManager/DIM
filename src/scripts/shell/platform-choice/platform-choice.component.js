import _ from 'lodash';
import templateUrl from './platform-choice.html';
import './platform-choice.scss';

export class PlatformChoiceController {
  constructor() {
    this.current = null;
    this.platforms = [];
  }

  $onChanges(changes) {
    if (changes.platforms) {
      self.platforms = changes.platforms.currentValue;
    }

    if (changes.current) {
      self.current = changes.current.currentValue;
    }
  }

  changePlatform(platform) {
    if (_.isFunction(self.onChange)) {
      self.onChange({
        platform: platform
      });
    }
  }
}

export const PlatformChoiceComponent = {
  bindings: {
    current: '<',
    onChange: '&',
    platforms: '<'
  },
  controller: 'dimPlatformChoiceCtrl',
  templateUrl: templateUrl
};