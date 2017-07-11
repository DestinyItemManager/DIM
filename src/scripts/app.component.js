import template from './app.html';
import './app.scss';
import changelog from '../views/changelog-toaster-release.html';

export const AppComponent = {
  template: template,
  controller: AppComponentCtrl
};

function AppComponentCtrl($window, $rootScope, $scope, dimInfoService, dimSettingsService, $i18next, toaster, $timeout) {
  'ngInject';

  this.$onInit = function() {
    this.qualityEnabled = $featureFlags.qualityEnabled;
    this.reviewsEnabled = $featureFlags.reviewsEnabled;
    this.settings = dimSettingsService;
    this.featureFlags = {
      colorA11y: $featureFlags.colorA11y
    };

    if ($featureFlags.colorA11y) {
      $scope.$watch(() => this.settings.colorA11y, (color) => {
        if (color && color !== '-') {
          document.querySelector('html').style.setProperty("--color-filter", `url(#${color.toLowerCase()})`);
        } else {
          document.querySelector('html').style.removeProperty("--color-filter");
        }
      });
    }

    // Check for old Chrome versions
    // TODO: do feature checks instead? Use Modernizr?
    const chromeVersion = /Chrome\/(\d+)/.exec($window.navigator.userAgent);
    if (chromeVersion && chromeVersion.length === 2 && parseInt(chromeVersion[1], 10) < 51) {
      $timeout(() => {
        dimInfoService.show('old-chrome', {
          title: $i18next.t('Help.UpgradeChrome'),
          body: $i18next.t('Views.UpgradeChrome'),
          type: 'error',
          hideable: false
        }, 0);
      });
    }

    // Show the changelog
    if ($featureFlags.changelogToaster) {
      $timeout(() => {
        dimInfoService.show(`changelogv${$DIM_VERSION.replace(/\./gi, '')}`, {
          title: $i18next.t('Help.Version', {
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
          title: $i18next.t('Help.NoStorage'),
          body: $i18next.t('Help.NoStorageMessage'),
          type: 'error',
          hideable: false
        }, 0);
      });
    }
  };
}
