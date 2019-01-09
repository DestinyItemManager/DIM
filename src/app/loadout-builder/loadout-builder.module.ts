import { module } from 'angular';

import { LoadoutBuilderComponent } from './loadout-builder.component';
import LoadoutBuilderItem from './LoadoutBuilderItem';
import { LoadoutBuilderLocks } from './loadout-builder-locks.component';
import { LoadoutBuilderCharacterSelect } from './loadout-builder-character-select.component';
import { LoadoutBuilderCharacterPopup } from './loadout-builder-character-popup.component';
import DragAndDropModule from 'angular-native-dragdrop';

import './loadout-builder.scss';
import { react2angular } from 'react2angular';
import ItemTalentGrid from '../item-popup/ItemTalentGrid';

export default module('loadoutBuilderModule', [DragAndDropModule])
  .component('loadoutBuilder', LoadoutBuilderComponent)
  .component(
    'loadoutBuilderItem',
    react2angular(LoadoutBuilderItem, ['item', 'shiftClickCallback'])
  )
  .component('dimTalentGrid', react2angular(ItemTalentGrid, ['talentGrid', 'perksOnly']))
  .component('loadoutBuilderLocks', LoadoutBuilderLocks)
  .component('loadoutBuilderCharacterSelect', LoadoutBuilderCharacterSelect)
  .component('loadoutBuilderCharacterPopup', LoadoutBuilderCharacterPopup).name;
