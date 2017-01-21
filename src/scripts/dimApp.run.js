import {
  compare
} from './utils';

function run($window, $rootScope, $translate, loadingTracker, $timeout,
  toaster, SyncService, dimInfoService, dimFeatureFlags, dimSettingsService) {
  "ngInject";

  $rootScope.loadingTracker = loadingTracker;

  // 1 Hour
  $rootScope.inactivityLength = 60 * 60 * 1000;

  $rootScope.isUserInactive = () => {
    var currentTime = Date.now();

    // Has This User Been Inactive For More Than An Hour
    return ((currentTime) - $rootScope.lastActivity) > $rootScope.inactivityLength;
  };

  $rootScope.trackActivity = () => {
    $rootScope.lastActivity = Date.now();
  };

  // Track Our Initial Activity of Starting the App
  $rootScope.trackActivity();

  $window.initgapi = () => {
    SyncService.init();
  };

  var chromeVersion = /Chrome\/(\d+)/.exec($window.navigator.userAgent);

  $rootScope.$on('dim-settings-loaded', () => {
    var language = dimSettingsService.language;
    if (chromeVersion && chromeVersion.length === 2 && parseInt(chromeVersion[1], 10) < 51) {
      dimInfoService.show('old-chrome', {
        title: $translate.instant('Help.UpgradeChrome'),
        view: 'views/' + language + '/upgrade-chrome.html?v=$DIM_VERSION',
        type: 'error'
      }, 0);
    }

    console.log('DIM v$DIM_VERSION - Please report any errors to https://www.reddit.com/r/destinyitemmanager');

    if (dimFeatureFlags.changelogToaster && compare('$DIM_FLAVOR', 'release')) {
      dimInfoService.show('changelogv$DIM_VERSION'.replace(/\./gi, ''), {
        title: compare('$DIM_FLAVOR', 'release') ? $translate.instant('Help.Version.Stable') : $translate.instant('Help.Version.Beta'),
        view: 'views/changelog-toaster' + (compare('$DIM_FLAVOR', 'release') ? '' : '-beta') + '.html?v=v$DIM_VERSION'
      });
    }
  });
}

export default run;
