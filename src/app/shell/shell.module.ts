import { module } from 'angular';

import UIRouterModule from '@uirouter/angularjs';

import { ActivityTrackerDirective } from './activity-tracker';
import { CountdownComponent } from './countdown.component';
import { StarRatingComponent } from './star-rating/star-rating.component';
import { ScrollClass } from './scroll-class.directive';
import Header from './Header';
import ManifestProgress from './ManifestProgress';
import { defaultAccountRoute } from './default-account.route';
import { destinyAccountRoute } from './destiny-account.route';
// tslint:disable-next-line:no-implicit-dependencies
import aboutTemplate from 'app/views/about.html';
// tslint:disable-next-line:no-implicit-dependencies
import supportTemplate from 'app/views/support.html';
import PageController from './page.controller';
import { ClickAnywhereButHere } from './click-anywhere-but-here.directive';
import loadingTracker from './dimLoadingTracker.factory';
import dimAngularFiltersModule from './dimAngularFilters.filter';
import { react2angular } from 'react2angular';
import { Loading } from '../dim-ui/Loading';

export const ShellModule = module('dimShell', [
    UIRouterModule,
    dimAngularFiltersModule
  ])
  .directive('dimActivityTracker', ActivityTrackerDirective)
  .factory('loadingTracker', loadingTracker)
  .component('countdown', CountdownComponent)
  .component('starRating', StarRatingComponent)
  .component('header', react2angular(Header, [], ['$scope']))
  .component('loading', react2angular(Loading, [], []))
  .component('manifestProgress', react2angular(ManifestProgress, ['destinyVersion'], ['$scope']))
  .directive('scrollClass', ScrollClass)
  .directive('dimClickAnywhereButHere', ClickAnywhereButHere)
  .config(defaultAccountRoute)
  .config(destinyAccountRoute)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'about',
      template: aboutTemplate,
      controller: PageController,
      url: '/about'
    });

    $stateProvider.state({
      name: 'support',
      template: supportTemplate,
      controller: PageController,
      url: '/backers'
    });
  })
  .name;
