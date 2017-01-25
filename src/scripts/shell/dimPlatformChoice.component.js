import templateUrl from './dimPlatformChoice.html';
import './dimPlatformChoice.scss';

const PlatformChoice = {
  bindings: {
    currentPlatform: '<',
    onPlatformChange: '&',
    platforms: '<'
  },
  controller: function PlatformChoiceCtrl() {
    var self = this;

    self.currentPlatform = null;
    self.platforms = [];

    self.$onChanges = (changes) => {
      if (changes.platforms) {
        self.platforms = changes.platforms.currentValue;
      }

      if (changes.currentPlatform) {
        self.currentPlatform = changes.currentPlatform.currentValue;
      }
    };

    self.onPlatformChangeHandler = function onPlatformChangeHandler(platform) {
      if (platform && (typeof self.onPlatformChange === 'function')) {
        self.onPlatformChange({ platform: platform });
      }
    };
  },
  templateUrl: templateUrl
};

export default PlatformChoice;