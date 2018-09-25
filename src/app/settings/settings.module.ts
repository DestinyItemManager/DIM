import { module } from 'angular';

import { SettingsComponent, SettingsController } from './settings.component';
import SortOrderEditor from './sort-order-editor';
import { react2angular } from 'react2angular';
import CharacterOrderEditor from './CharacterOrderEditor';

export default module('settingsModule', [])
  .component('dimSettings', SettingsComponent)
  .controller('dimSettingsCtrl', SettingsController)
  .component('sortOrderEditor', react2angular(SortOrderEditor, ['order', 'onSortOrderChanged']))
  .component('characterOrderEditor', react2angular(CharacterOrderEditor, ['onSortOrderChanged']))
  .name;
