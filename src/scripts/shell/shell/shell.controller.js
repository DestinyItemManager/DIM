export default class ShellController {
  constructor(dimSettingsService, dimFeatureFlags) {
    'ngInject';

    this.featureFlags = dimFeatureFlags;
    this.settings = dimSettingsService;
  }
}
