export default class ShellController {
  constructor(dimSettingsService) {
    'ngInject';

    this.qualityEnabled = $featureFlags.qualityEnabled;
    this.settings = dimSettingsService;
  }
}
