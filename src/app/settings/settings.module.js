import angular from 'angular';

import { SettingsService } from './dimSettingsService.factory';
import { SettingsComponent, SettingsController } from './settings.component';
import SortOrderEditor from './sort-order-editor';
import { react2angular } from 'react2angular';

export default angular
  .module('settingsModule', [])
  .controller('dimSettingsCtrl', SettingsController)
  .component('settings', SettingsComponent)
  .component('sortOrderEditor', react2angular(SortOrderEditor, ['order', 'onSortOrderChanged']))
  .factory('dimSettingsService', SettingsService)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'settings',
      component: 'settings',
      url: '/settings',
      resolve: {
        settings(dimSettingsService) {
          'ngInject';
          return dimSettingsService.ready;
        }
      }
    });
  })
  .name;
