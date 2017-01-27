import angular from 'angular';
import {
  PlatformChoiceComponent,
  PlatformChoiceController
} from './platform-choice/index';

angular
  .module('dimShell', [])
  .controller('dimPlatformChoiceCtrl', PlatformChoiceController)
  .component('dimPlatformChoice', PlatformChoiceComponent);

export default 'dimShell';