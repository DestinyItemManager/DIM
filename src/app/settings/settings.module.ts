import { module } from 'angular';

import { SettingsComponent } from './settings.component';
import SortOrderEditor from './sort-order-editor';
import { react2angular } from 'react2angular';
import { settings } from '../settings/settings';

export default module('settingsModule', [])
  .component('settings', SettingsComponent)
  .component('sortOrderEditor', react2angular(SortOrderEditor, ['order', 'onSortOrderChanged']))
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'settings',
      component: 'settings',
      url: '/settings?gdrive',
      resolve: {
        settings() {
          return settings.ready;
        }
      }
    });
  })
  .name;
