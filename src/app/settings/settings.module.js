import angular from 'angular';

import { SettingsService } from './dimSettingsService.factory';
import { SettingsComponent, SettingsController } from './settings.component';

export default angular
  .module('settingsModule', [])
  .controller('dimSettingsCtrl', SettingsController)
  .component('settings', SettingsComponent)
  .factory('dimSettingsService', SettingsService)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'settings',
      component: 'settings',
      url: '/settings?gdrive',
      resolve: {
        settings(dimSettingsService) {
          'ngInject';
          return dimSettingsService.ready;
        }
      }
    });
  })
  .name;
