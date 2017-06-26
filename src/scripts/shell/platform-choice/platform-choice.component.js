import template from './platform-choice.html';
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
    if (platform && this.onPlatformChange) {
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
  template: template
};
