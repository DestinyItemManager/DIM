import changelog from '../views/changelog-toaster-release.html';

import upgradeChromeEN from '../views/en/upgrade-chrome.html';
import upgradeChromeIT from '../views/it/upgrade-chrome.html';
import upgradeChromeDE from '../views/de/upgrade-chrome.html';
import upgradeChromeFR from '../views/fr/upgrade-chrome.html';
import upgradeChromeES from '../views/es/upgrade-chrome.html';
import upgradeChromeJA from '../views/ja/upgrade-chrome.html';
import upgradeChromePTBR from '../views/pt-br/upgrade-chrome.html';

const upgradeChrome = {
  en: upgradeChromeEN,
  it: upgradeChromeIT,
  de: upgradeChromeDE,
  fr: upgradeChromeFR,
  es: upgradeChromeES,
  ja: upgradeChromeJA,
  "pt-br": upgradeChromePTBR
};

function run($window, $rootScope, $translate, SyncService, dimInfoService, dimFeatureFlags, dimSettingsService) {
  'ngInject';

  $window.initgapi = () => {
    SyncService.init();
  };

  var chromeVersion = /Chrome\/(\d+)/.exec($window.navigator.userAgent);

  $rootScope.$on('dim-settings-loaded', () => {
    var language = dimSettingsService.language;
    if (chromeVersion && chromeVersion.length === 2 && parseInt(chromeVersion[1], 10) < 51) {
      dimInfoService.show('old-chrome', {
        title: $translate.instant('Help.UpgradeChrome'),
        view: upgradeChrome[language],
        type: 'error'
      }, 0);
    }

    console.log('DIM v' + $DIM_VERSION + ' (' + $DIM_FLAVOR + ') - Please report any errors to https://www.reddit.com/r/destinyitemmanager');

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
