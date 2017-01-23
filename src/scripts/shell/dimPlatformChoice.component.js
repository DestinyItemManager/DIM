import templateUrl from './dimPlatformChoice.html';
import './dimPlatformChoice.scss';

const PlatformChoice = {
  bindings: {
    currentPlatform: '<',
    currentUser: '<',
    onPlatformChange: '&',
    platforms: '<'
  },
  controller: function PlatformChoiceCtrl() {
    var self = this;

    self.currentPlatform = null;
    self.currentUser = null;
    self.platforms = [];

    self.$onChanges = (changes) => { // eslint-disable-line no-unused-vars
      if (changes.platforms) {
        self.platforms = changes.platforms.currentValue;
      }
    };

    function toggle(platform) { // eslint-disable-line no-unused-vars
      if (platform) {
        self.currentPlatform = platform;

        if (self.onPlatformChange) {
          self.onPlatformChange({ platform: platform });
        }
      }
    }
  },
  templateUrl: templateUrl
};

// <select id="system" ng-if="vm.platforms.length > 1" ng-options="platform.label for platform in vm.platforms" ng-model="vm.active" ng-change="vm.update()"></select>
// <i ng-if="vm.active" class="fa fa-user"></i> <span id="user" class="header-right">{{ vm.active.id }}</span>

// function PlatformChoiceCtrl(dimPlatformService, dimState, loadingTracker) {
//   var vm = this;

//   vm.active = null;
//   vm.platforms = null;
//   vm.update = function update() {
//     dimPlatformService.setActive(vm.active);
//   };

//   loadingTracker.addPromise(dimPlatformService.getPlatforms());

//   $scope.$on('dim-platforms-updated', function (e, args) {
//     vm.platforms = args.platforms;
//   });

//   $scope.$on('dim-active-platform-updated', function (e, args) {
//     dimState.active = vm.active = args.platform;
//   });
// }

export default PlatformChoice;