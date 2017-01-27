import isFunction from 'lodash/isFunction';
import templateUrl from './platform-choice.html';
import './platform-choice.scss';

class PlatformChoiceController {
  constructor() {
    this.current = null;
    this.onChange = null;
    this.platforms = [];
  }

  $onChanges(changes) {
    if (changes.platforms) {
      this.platforms = changes.platforms.currentValue;
    }

    if (changes.current) {
      this.current = changes.current.currentValue;
    }
  }

  change(platform) {
    if (platform && isFunction(this.onPlatformChange)) {
      this.onPlatformChange({
        platform: platform
      });
    }
  }
}

export const PlatformChoiceComponent = {
  bindings: {
    current: '<',
    onPlatformChange: '&',
    platforms: '<'
  },
  controller: PlatformChoiceController,
  templateUrl: templateUrl
};