import template from './app.html';
import './app.scss';
import changelog from '../views/changelog-toaster-release.html';
import { isPhonePortrait, isPhonePortraitStream } from './mediaQueries';
import { subscribeOnScope } from './rx-utils';
import * as _ from 'underscore';
import { dimState } from './state';
import { settings } from './settings/settings';
import { showInfoPopup } from './shell/info-popup';
import { IComponentOptions, IController, IScope, ITimeoutService } from 'angular';

export const AppComponent: IComponentOptions = {
  template,
  controller: AppComponentCtrl
};

function AppComponentCtrl(
  this: IController,
  $scope: IScope,
  $i18next,
  $timeout: ITimeoutService,
  hotkeys
) {
  'ngInject';

  this.$onInit = function() {
    this.reviewsEnabled = $featureFlags.reviewsEnabled;
    this.settings = settings;
    this.featureFlags = {
      colorA11y: $featureFlags.colorA11y
    };

    $scope.$watch(() => this.settings.itemSize, (size) => {
      document.querySelector('html')!.style.setProperty("--item-size", `${size}px`);
    });
    $scope.$watch(() => this.settings.charCol, (cols) => {
      document.querySelector('html')!.style.setProperty("--character-columns", cols);
    });
    $scope.$watch(() => this.settings.vaultMaxCol, (cols) => {
      document.querySelector('html')!.style.setProperty("--vault-max-columns", cols);
    });

    $scope.$watch(() => this.settings.charColMobile, (cols) => {
      // this check is needed so on start up/load this doesn't override the value set above on "normal" mode.
      if (isPhonePortrait()) {
        document.querySelector('html')!.style.setProperty("--character-columns", cols);
      }
    });
    // a subscribe on isPhonePortraitStream is needed when the user on mobile changes from portrait to landscape
    // or a user on desktop shrinks the browser window below isphoneportrait treshold value
    subscribeOnScope($scope, isPhonePortraitStream(), (isPhonePortrait) => {
      if (isPhonePortrait) {
        document.querySelector('html')!.style.setProperty("--character-columns", this.settings.charColMobile);
      } else {
        document.querySelector('html')!.style.setProperty("--character-columns", this.settings.charCol);
      }
    });

    hotkeys = hotkeys.bindTo($scope);

    hotkeys.add({
      combo: ['ctrl+alt+shift+d'],
      callback() {
        dimState.debug = true;
        console.log("***** DIM DEBUG MODE ENABLED *****");
      }
    });

    if ($featureFlags.colorA11y) {
      $scope.$watch(() => this.settings.colorA11y, (color) => {
        if (color && color !== '-') {
          document.querySelector('html')!.style.setProperty("--color-filter", `url(#${color.toLowerCase()})`);
        } else {
          document.querySelector('html')!.style.removeProperty("--color-filter");
        }
      });
    }

    // Show the changelog
    if ($featureFlags.changelogToaster) {
      $timeout(() => {
        showInfoPopup(`changelogv${$DIM_VERSION.replace(/\./gi, '')}`, {
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
      if (!window.indexedDB) {
        throw new Error("IndexedDB not available");
      }
    } catch (e) {
      console.log('storage test', e);
      $timeout(() => {
        showInfoPopup('no-storage', {
          title: $i18next.t('Help.NoStorage'),
          body: $i18next.t('Help.NoStorageMessage'),
          type: 'error',
          hideable: false
        }, 0);
      });
    }

    if (window.BroadcastChannel) {
      const updateChannel = new BroadcastChannel('precache-updates');

      const updateMessage = _.once(() => {
        $timeout(() => {
          showInfoPopup('update-available', {
            title: $i18next.t('Help.UpdateAvailable'),
            body: $i18next.t('Help.UpdateAvailableMessage'),
            type: 'warn',
            hideable: false
          }, 0);
        });
      });

      updateChannel.addEventListener('message', updateMessage);
      $scope.$on('$destroy', () => {
        updateChannel.removeEventListener('message', updateMessage);
      });
    }
  };

  this.language = `lang-${$i18next.i18n.language}`;
  $scope.$on('i18nextLanguageChange', () => {
    this.language = `lang-${$i18next.i18n.language}`;
  });
}
