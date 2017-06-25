import changelog from '../views/changelog-toaster-release.html';

function run($window, $rootScope, $translate, SyncService, dimInfoService, $timeout) {
  'ngInject';

  SyncService.init();

  var chromeVersion = /Chrome\/(\d+)/.exec($window.navigator.userAgent);

  // Variables for templates that webpack does not automatically correct.
  $rootScope.$DIM_VERSION = $DIM_VERSION;
  $rootScope.$DIM_FLAVOR = $DIM_FLAVOR;
  $rootScope.$DIM_CHANGELOG = $DIM_CHANGELOG;
  $rootScope.$DIM_BUILD_DATE = new Date($DIM_BUILD_DATE).toLocaleString();

  const unregister = $rootScope.$on('dim-settings-loaded', () => {
    if (chromeVersion && chromeVersion.length === 2 && parseInt(chromeVersion[1], 10) < 51) {
      $timeout(function() {
        dimInfoService.show('old-chrome', {
          title: $translate.instant('Help.UpgradeChrome'),
          body: $translate.instant('Views.UpgradeChrome'),
          type: 'error',
          hideable: false
        }, 0);
      }, 1000);
    }

    console.log('DIM v' + $DIM_VERSION + ' (' + $DIM_FLAVOR + ') - Please report any errors to https://www.reddit.com/r/destinyitemmanager');

    if ($featureFlags.changelogToaster) {
      dimInfoService.show('changelogv' + $DIM_VERSION.replace(/\./gi, ''), {
        title: $translate.instant('Help.Version', {
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
