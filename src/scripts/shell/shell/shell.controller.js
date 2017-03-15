export default class ShellController {
  constructor(dimSettingsService, dimFeatureFlags) {
    'ngInject';

    this.featureFlags = dimFeatureFlags;
    this.settings = dimSettingsService;
    this.classes = {
      'show-elements': this.settings.showElements,
      itemQuality: this.featureFlags.qualityEnabled && this.settings.itemQuality,
      'show-new-items': this.settings.showNewItems,
      'new-item-animated': this.settings.showNewAnimation
    };
  }
}
