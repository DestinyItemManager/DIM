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
    let platforms = [];
    let selected = null;
    const platformState = state.platform;

    if (platformState.ids.length > 0) {
      platforms = platformState.ids.map((id) => platformState.platforms[id]);
    }

    if (platformState.selected > -1) {
      selected = platformState.platforms[platformState.selected];
    }

    return {
      platforms,
      selected
    };
  }

  platformChange(platform) {
    this.setSelectedPlatform(platform);
  }
}

export default ShellController;