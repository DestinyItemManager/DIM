export default class ShellController {
  constructor(dimSettingsService) {
    'ngInject';

    this.qualityEnabled = $featureFlags.qualityEnabled;
    this.reviewsEnabled = $featureFlags.reviewsEnabled;
    this.settings = dimSettingsService;
  }
}
