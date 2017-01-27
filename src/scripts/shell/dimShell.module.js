import angular from 'angular';
import {
  ActivityTrackerService
} from './activity-tracker.service';
import {
  PlatformChoiceComponent
} from './platform-choice';

angular
  .module('dimShell', [])
  .component('dimPlatformChoice', PlatformChoiceComponent)
  .service('dimActivityTracker', ActivityTrackerService);

export default 'dimShell';