import _ from 'underscore';
import templateUrl from './shell.html';
import './shell.scss';

class ShellController {
  constructor($ngRedux, dimPlatformService, loadingTracker, PlatformsActions) {
    'ngInject';

    this.store = $ngRedux;
    this.PlatformsActions = PlatformsActions;
    this.platformService = dimPlatformService;
    this.tracker = loadingTracker;
  }

  $onInit() {
    const actions = Object.assign({}, this.PlatformsActions);
    this.unsubscribe = this.store.connect(this.mapStateToThis, actions)(this);

    this.getPlatforms();
  }

  $onDestroy() {
    this.unsubscribe();
  }

  mapStateToThis(state) {
    return {
      platforms: state.platforms,
      currentPlatform: state.platform
    };
  }

  platformChange(platform) {
    this.selectPlatform(platform);
  }

  // $scope.$on('dim-platforms-updated', function(e, args) {
  //   vm.platforms = args.platforms;
  // });

  // $scope.$on('dim-active-platform-updated', function(e, args) {
  //   dimState.active = vm.currentPlatform = args.platform;
  // });

  // loadingTracker.addPromise(dimPlatformService.getPlatforms());
}

export const ShellComponent = {
  controller: ShellController,
  templateUrl
};