import changelog from '../views/changelog-toaster-release.html';

function run($window, $rootScope, $i18next, SyncService, dimInfoService, $timeout) {
  'ngInject';

  SyncService.init();

  const chromeVersion = /Chrome\/(\d+)/.exec($window.navigator.userAgent);

  // Variables for templates that webpack does not automatically correct.
  $rootScope.$DIM_VERSION = $DIM_VERSION;
  $rootScope.$DIM_FLAVOR = $DIM_FLAVOR;
  $rootScope.$DIM_CHANGELOG = $DIM_CHANGELOG;
  $rootScope.$DIM_BUILD_DATE = new Date($DIM_BUILD_DATE).toLocaleString();

  const unregister = $rootScope.$on('dim-settings-loaded', () => {
    if (chromeVersion && chromeVersion.length === 2 && parseInt(chromeVersion[1], 10) < 51) {
      $timeout(() => {
        dimInfoService.show('old-chrome', {
          title: $i18next.t('Help.UpgradeChrome'),
          body: $i18next.t('Views.UpgradeChrome'),
          type: 'error',
          hideable: false
        }, 0);
      }, 1000);
    }

    console.log(`DIM v${$DIM_VERSION} (${$DIM_FLAVOR}) - Please report any errors to https://www.reddit.com/r/destinyitemmanager`);

    if ($featureFlags.changelogToaster) {
      dimInfoService.show(`changelogv${$DIM_VERSION.replace(/\./gi, '')}`, {
        title: $i18next.t('Help.Version', {
          version: $DIM_VERSION,
          beta: $DIM_FLAVOR === 'beta'
        }),
        body: changelog
      });
    }

    unregister();
  });
}

export default run;
