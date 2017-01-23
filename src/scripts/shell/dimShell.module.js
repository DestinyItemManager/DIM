import angular from 'angular';
import PlatformChoice from './dimPlatformChoice.component';

angular
  .module('dimShell', [])
  .component('dimPlatformChoice', PlatformChoice);

export default 'dimShell';