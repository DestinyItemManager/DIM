import angular from 'angular';

import { SettingsService } from './dimSettingsService.factory';
import { SettingsComponent, SettingsController } from './settings.component';

export default angular
  .module('settingsModule', [])
  .controller('dimSettingsCtrl', SettingsController)
  .component('settings', SettingsComponent)
  .factory('dimSettingsService', SettingsService)
  .name;
