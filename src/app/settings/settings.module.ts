import { module } from 'angular';

import { SettingsComponent, SettingsController } from './settings.component';
import SortOrderEditor from './sort-order-editor';
import { react2angular } from 'react2angular';

export default module('settingsModule', [])
  .component('settings', SettingsComponent)
  .controller('dimSettingsCtrl', SettingsController)
  .component('sortOrderEditor', react2angular(SortOrderEditor, ['order', 'onSortOrderChanged']))
  .name;
