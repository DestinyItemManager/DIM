import angular from 'angular';

import UIRouterModule from '@uirouter/angularjs';

import { ActivityTrackerDirective, ActivityTrackerService } from './activity-tracker';
import { PlatformChoiceComponent } from './platform-choice';
import shellComponent from './shell/shell.component';
import contentComponent from './content/content.component';
import backLinkComponent from './shell/backLink.component';
import { CountdownComponent } from './countdown.component';
import { StarRatingComponent } from './star-rating/star-rating.component';
import { ColorA11yComponent } from './color-a11y/color-a11y.component';

export const ShellModule = angular
  .module('dimShell', [
    UIRouterModule
  ])
  .directive('dimActivityTracker', ActivityTrackerDirective)
  .service('dimActivityTrackerService', ActivityTrackerService)
  .component('dimPlatformChoice', PlatformChoiceComponent)
  .component('dimShell', shellComponent)
  .component('content', contentComponent)
  .component('backLink', backLinkComponent)
  .component('countdown', CountdownComponent)
  .component('starRating', StarRatingComponent)
  .component('colorA11y', ColorA11yComponent)
  .config(($stateProvider) => {
    'ngInject';

    const states = [{
      name: 'shell',
      parent: 'root',
      abstract: true,
      component: 'dimShell'
    }, {
      name: 'content',
      parent: 'shell',
      abstract: true,
      component: 'content'
    }];

    states.forEach((state) => {
      $stateProvider.state(state);
    });
  })
  .name;
