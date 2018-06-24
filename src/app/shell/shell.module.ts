import { module } from 'angular';

import { ActivityTrackerDirective } from './activity-tracker';
import { CountdownComponent } from './countdown.component';
import { StarRatingComponent } from './star-rating/star-rating.component';
import { ScrollClass } from './scroll-class.directive';
import Header from './Header';
import ManifestProgress from './ManifestProgress';
import { PageComponent } from './page.component';
import { ClickAnywhereButHere } from './click-anywhere-but-here.directive';
import loadingTracker from './dimLoadingTracker.factory';
import dimAngularFiltersModule from './dimAngularFilters.filter';
import { react2angular } from 'react2angular';
import { ToasterContainerComponent } from './toaster-container.component';

export const ShellModule = module('dimShell', [
    dimAngularFiltersModule
  ])
  .directive('dimActivityTracker', ActivityTrackerDirective)
  .factory('loadingTracker', loadingTracker)
  .component('dimPage', PageComponent)
  .component('countdown', CountdownComponent)
  .component('starRating', StarRatingComponent)
  .component('header', react2angular(Header, [], ['$scope']))
  .component('manifestProgress', react2angular(ManifestProgress, ['destinyVersion'], ['$scope']))
  .component('dimToasterContainer', ToasterContainerComponent)
  .directive('scrollClass', ScrollClass)
  .directive('dimClickAnywhereButHere', ClickAnywhereButHere)
  .name;
