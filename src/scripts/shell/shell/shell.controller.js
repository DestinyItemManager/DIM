import { getAll, getSelected } from '../platform/platform.reducers';

class ShellController {
  constructor($ngRedux, PlatformsActions) {
    'ngInject';

    this.store = $ngRedux;
    this.actions = PlatformsActions;
  }

  $onInit() {
    this.unsubscribe = this.store.connect(this.mapStateToThis, this.actions)(this);

    this.loadPlatforms();
  }

  $onDestroy() {
    this.unsubscribe();
  }

  mapStateToThis(state) {
    return {
      platforms: getAll(state.platform),
      selected: getSelected(state.platform)
    };
  }

  platformChange(platform) {
    this.setSelectedPlatform(platform);
  }
}

export default ShellController;