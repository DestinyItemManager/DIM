import * as React from 'react';
import { UIView } from '@uirouter/react';
import Header from './shell/Header';
import classNames from 'classnames';
import { angular2react } from 'angular2react';
import { ToasterContainerComponent } from './shell/toaster-container.component';
import { $rootScope } from 'ngimport';
import { settings } from './settings/settings';
import { lazyInjector } from '../lazyInjector';
import { Subscription } from 'rxjs/Subscription';
import { isPhonePortrait, isPhonePortraitStream } from './mediaQueries';
import { showInfoPopup } from './shell/info-popup';
import { t } from 'i18next';
import { ActivityTracker } from './dim-ui/ActivityTracker';

const ToasterContainer = angular2react('dimToasterContainer', ToasterContainerComponent, lazyInjector.$injector as angular.auto.IInjectorService);

function setCSSVariable(property: string, value: any) {
  document.querySelector('html')!.style.setProperty(property, value.toString());
}

export default class App extends React.Component {
  private settingsSubscription?: Subscription;
  private isPhonePortraitSubscription?: Subscription;
  private $scope = $rootScope.$new(true);

  componentDidMount() {
    this.settingsSubscription = settings.$updates.subscribe(() => {
      // TODO: Move away from this gross way of forcing updates
      this.setState({});
    });

    // TODO: move away from scope watchers
    this.$scope.$watch(() => settings.itemSize, (size) => {
      setCSSVariable("--item-size", `${size}px`);
    });
    this.$scope.$watch(() => settings.charCol, (cols) => {
      if (!isPhonePortrait()) {
        setCSSVariable("--character-columns", cols);
      }
    });
    this.$scope.$watch(() => settings.vaultMaxCol, (cols) => {
      setCSSVariable("--vault-max-columns", cols);
    });

    this.$scope.$watch(() => settings.charColMobile, (cols) => {
      // this check is needed so on start up/load this doesn't override the value set above on "normal" mode.
      if (isPhonePortrait()) {
        setCSSVariable("--character-columns", cols);
      }
    });
    // a subscribe on isPhonePortraitStream is needed when the user on mobile changes from portrait to landscape
    // or a user on desktop shrinks the browser window below isphoneportrait treshold value
    this.isPhonePortraitSubscription = isPhonePortraitStream().subscribe((isPhonePortrait) => {
      setCSSVariable("--character-columns", (isPhonePortrait) ? settings.charColMobile : settings.charCol);
    });

    if ($featureFlags.colorA11y) {
      this.$scope.$watch(() => settings.colorA11y, (color) => {
        if (color && color !== '-') {
          setCSSVariable("--color-filter", `url(#${color.toLowerCase()})`);
        } else {
          document.querySelector('html')!.style.removeProperty("--color-filter");
        }
      });
    }

    try {
      localStorage.setItem('test', 'true');
      if (!window.indexedDB) {
        throw new Error("IndexedDB not available");
      }
    } catch (e) {
      console.log('storage test', e);
      setTimeout(() => {
        showInfoPopup('no-storage', {
          title: t('Help.NoStorage'),
          body: t('Help.NoStorageMessage'),
          type: 'error',
          hideable: false
        }, 0);
      });
    }
  }

  componentWillUnmount() {
    if (this.settingsSubscription) {
      this.settingsSubscription.unsubscribe();
    }
    if (this.isPhonePortraitSubscription) {
      this.isPhonePortraitSubscription.unsubscribe();
    }
    this.$scope.$destroy();
  }

  render() {
    return (
      <div
        className={classNames("app", `lang-${settings.language}`, {
          'show-reviews': $featureFlags.reviewsEnabled && settings.showReviews,
          'show-elements': settings.showElements,
          itemQuality: settings.itemQuality,
          'show-new-items': settings.showNewItems,
          'new-item-animated': settings.showNewAnimation
        })}
      >
        <Header $rootScope={$rootScope}/>
        <UIView />
        <ToasterContainer/>
        <ActivityTracker/>
        {$featureFlags.colorA11y && <ColorA11y />}
      </div>
    );
  }
}

function ColorA11y() {
  if ($featureFlags.colorA11y) {
    return (
      <svg width="0" height="0">
        <defs>
          <filter id="protanopia">
            <feColorMatrix type="matrix" values="0.567,0.433,0,0,0  0.558,0.442,0,0,0  0 0.242,0.758,0,0  0,0,0,1,0" />
          </filter>
          <filter id="protanomaly">
            <feColorMatrix type="matrix" values="0.817,0.183,0,0,0  0.333,0.667,0,0,0  0,0.125,0.875,0,0  0,0,0,1,0" />
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix type="matrix" values="0.625,0.375,0,0,0  0.7,0.3,0,0,0  0,0.3,0.7,0,0  0,0,0,1,0" />
          </filter>
          <filter id="deuteranomaly">
            <feColorMatrix type="matrix" values="0.8,0.2,0,0,0  0.258,0.742,0,0,0  0,0.142,0.858,0,0  0,0,0,1,0" />
          </filter>
          <filter id="tritanopia">
              <feColorMatrix type="matrix" values="0.95,0.05,0,0,0  0,0.433,0.567,0,0  0,0.475,0.525,0,0  0,0,0,1,0" />
          </filter>
          <filter id="tritanomaly">
            <feColorMatrix type="matrix" values="0.967,0.033,0,0,0  0,0.733,0.267,0,0  0,0.183,0.817,0,0  0,0,0,1,0" />
          </filter>
          <filter id="achromatopsia">
            <feColorMatrix type="matrix" values="0.299,0.587,0.114,0,0  0.299,0.587,0.114,0,0  0.299,0.587,0.114,0,0  0,0,0,1,0" />
          </filter>
          <filter id="achromatomaly">
            <feColorMatrix type="matrix" values="0.618,0.320,0.062,0,0  0.163,0.775,0.062,0,0  0.163,0.320,0.516,0,0  0,0,0,1,0" />
          </filter>
        </defs>
      </svg>
    );
  }
  return null;
}
