import template from './app.html';
import './app.scss';
import changelog from '../views/changelog-toaster-release.html';
import _ from 'underscore';
import i18next from 'i18next';

export const AppComponent = {
  template: template,
  controller: AppComponentCtrl
};

function AppComponentCtrl(
  $window,
  $rootScope,
  $scope,
  dimInfoService,
  dimSettingsService,
  $i18next,
  toaster,
  $timeout,
  hotkeys,
  dimState
) {
  'ngInject';

  this.$onInit = function() {
    this.reviewsEnabled = $featureFlags.reviewsEnabled;
    this.settings = dimSettingsService;
    this.featureFlags = {
      colorA11y: $featureFlags.colorA11y
    };

    this.settings = dimSettingsService;
    $scope.$watch(() => this.settings.itemSize, (size) => {
      document.querySelector('html').style.setProperty("--item-size", `${size}px`);
    });
    $scope.$watch(() => this.settings.charCol, (cols) => {
      document.querySelector('html').style.setProperty("--character-columns", cols);
    });
    $scope.$watch(() => this.settings.vaultMaxCol, (cols) => {
      document.querySelector('html').style.setProperty("--vault-max-columns", cols);
    });

    hotkeys = hotkeys.bindTo($scope);

    hotkeys.add({
      combo: ['ctrl+alt+shift+d'],
      callback: function() {
        dimState.debug = true;
        console.log("***** DIM DEBUG MODE ENABLED *****");
      }
    });


    if ($featureFlags.colorA11y) {
      $scope.$watch(() => this.settings.colorA11y, (color) => {
        if (color && color !== '-') {
          document.querySelector('html').style.setProperty("--color-filter", `url(#${color.toLowerCase()})`);
        } else {
          document.querySelector('html').style.removeProperty("--color-filter");
        }
      });
    }

    // Show the changelog
    if ($featureFlags.changelogToaster) {
      $timeout(() => {
        dimInfoService.show(`changelogv${$DIM_VERSION.replace(/\./gi, '')}`, {
          title: $i18next.t('Help.Version', {
            version: $DIM_VERSION,
            context: $DIM_FLAVOR
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

    if (window.BroadcastChannel) {
      const updateChannel = new window.BroadcastChannel('precache-updates');

      const updateMessage = _.once(() => {
        $timeout(() => {
          dimInfoService.show('update-available', {
            title: $i18next.t('Help.UpdateAvailable'),
            body: $i18next.t('Help.UpdateAvailableMessage'),
            type: 'warn',
            hideable: false
          }, 0);
        });
      });

      const messageHandler = () => updateMessage();

      updateChannel.addEventListener('message', messageHandler);
      $scope.$on('$destroy', () => {
        updateChannel.removeEventListener('message', messageHandler);
      });
    }
  };

  $scope.$on('i18nextLanguageChange', () => {
    this.language = `lang-${i18next.language}`;
  });
}
