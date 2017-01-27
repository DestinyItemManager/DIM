import angular from 'angular';
// import {
//   AppController
// } from './dimAppCtrl.controller';
import {
  PlatformChoiceComponent,
  PlatformChoiceController
} from './platform-choice/index';

angular
  .module('dimShell', [])
  // .controller('dimAppCtrl', AppController)
  .component('dimPlatformChoice', PlatformChoiceComponent)
  .controller('dimPlatformChoiceCtrl', PlatformChoiceController);

export default 'dimShell';