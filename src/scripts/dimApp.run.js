import changelog from '../views/changelog-toaster-release.html';

import upgradeChrome from '../views/upgrade-chrome.html';

function run($window, $rootScope, $translate, SyncService, dimInfoService, dimFeatureFlags) {
  'ngInject';

  $window.initgapi = () => {
    SyncService.init();
  };

  var chromeVersion = /Chrome\/(\d+)/.exec($window.navigator.userAgent);

  $rootScope.$on('dim-settings-loaded', () => {
    if (chromeVersion && chromeVersion.length === 2 && parseInt(chromeVersion[1], 10) < 51) {
      dimInfoService.show('old-chrome', {
        title: $translate.instant('Help.UpgradeChrome'),
        view: upgradeChrome,
        type: 'error'
      }, 0);
    }

    console.log('DIM v$DIM_VERSION - Please report any errors to https://www.reddit.com/r/destinyitemmanager');

    if (dimFeatureFlags.changelogToaster && ($DIM_FLAVOR === 'release')) {
      dimInfoService.show('changelogv' + $DIM_VERSION.replace(/\./gi, ''), {
        title: $DIM_FLAVOR === 'release' ? $translate.instant('Help.Version.Stable', {
          version: $DIM_VERSION
        }) : $translate.instant('Help.Version.Beta', {
          version: $DIM_VERSION
        }),
        view: changelog
      });
    }
  });
}

export default run;