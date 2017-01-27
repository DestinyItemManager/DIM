import isFunction from 'lodash/isFunction';
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

  change(platform) {
    debugger;
    if (platform && isFunction(self.onChange)) {
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
  controller: 'dimPlatformChoiceCtrl as $ctrl',
  templateUrl: templateUrl
};