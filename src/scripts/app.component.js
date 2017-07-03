import template from './app.html';
import './app.scss';
import changelog from '../views/changelog-toaster-release.html';

export const AppComponent = {
  template: template,
  controller: AppComponentCtrl
};

function AppComponentCtrl($window, $rootScope, dimInfoService, dimSettingsService, $translate, toaster, $timeout) {
  'ngInject';

  this.$onInit = function() {
    this.qualityEnabled = $featureFlags.qualityEnabled;
    this.reviewsEnabled = $featureFlags.reviewsEnabled;
    this.settings = dimSettingsService;

    // Check for old Chrome versions
    // TODO: do feature checks instead? Use Modernizr?
    const chromeVersion = /Chrome\/(\d+)/.exec($window.navigator.userAgent);
    if (chromeVersion && chromeVersion.length === 2 && parseInt(chromeVersion[1], 10) < 51) {
      $timeout(() => {
        dimInfoService.show('old-chrome', {
          title: $translate.instant('Help.UpgradeChrome'),
          body: $translate.instant('Views.UpgradeChrome'),
          type: 'error',
          hideable: false
        }, 0);
      });
    }

    // Show the changelog
    if ($featureFlags.changelogToaster) {
      $timeout(() => {
        dimInfoService.show(`changelogv${$DIM_VERSION.replace(/\./gi, '')}`, {
          title: $translate.instant('Help.Version', {
            version: $DIM_VERSION,
            beta: $DIM_FLAVOR === 'beta'
          }),
          body: changelog
        });
      });
    }

    try {
      localStorage.setItem('test', 'true');
    } catch (e) {
      console.log('storage test', e);
      $timeout(() => {
        dimInfoService.show('no-storage', {
          title: $translate.instant('Help.NoStorage'),
          body: $translate.instant('Help.NoStorageMessage'),
          type: 'error',
          hideable: false
        }, 0);
      });
    }
  };
}
