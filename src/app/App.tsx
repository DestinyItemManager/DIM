import * as React from 'react';
import { UIView } from '@uirouter/react';
import Header from './shell/Header';
import classNames from 'classnames';
import { angular2react } from 'angular2react';
import { ToasterContainerComponent } from './shell/toaster-container.component';
import { $rootScope } from 'ngimport';
import { settings } from './settings/settings';
import { lazyInjector } from '../lazyInjector';

const ToasterContainer = angular2react('dimToasterContainer', ToasterContainerComponent, lazyInjector.$injector as angular.auto.IInjectorService);

// TODO: settings needs to update
// TODO: all the contents of app.component!

export class App extends React.Component {
  render() {
    const language = 'en';
    const reviewsEnabled = false;

    return (
      <div
        className={classNames("app", language, {
          'show-reviews': reviewsEnabled && settings.showReviews,
          'show-elements': settings.showElements,
          itemQuality: settings.itemQuality,
          'show-new-items': settings.showNewItems,
          'new-item-animated': settings.showNewAnimation
        })}
      >
        <Header $rootScope={$rootScope}/>
        <UIView />
        <ToasterContainer/>
      </div>
    );
  }
}

// TODO: dim-activity-tracker
// TODO: <ng-include ng-if="::$ctrl.featureFlags.colorA11y" src="'data/color-a11y.svg'"></ng-include>
