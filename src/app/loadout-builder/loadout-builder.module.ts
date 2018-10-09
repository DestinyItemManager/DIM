import { module } from 'angular';

import { LoadoutBuilderComponent } from './loadout-builder.component';
import { LoadoutBuilderItem } from './loadout-builder-item.component';
import { LoadoutBuilderLocks } from './loadout-builder-locks.component';
import { LoadoutBuilderCharacterSelect } from './loadout-builder-character-select.component';
import { LoadoutBuilderCharacterPopup } from './loadout-builder-character-popup.component';
import { StoreItemComponent } from '../inventory/dimStoreItem.directive';

import './loadout-builder.scss';

export default module('loadoutBuilderModule', [])
  .component('dimStoreItem', StoreItemComponent)
  .component('loadoutBuilder', LoadoutBuilderComponent)
  .component('loadoutBuilderItem', LoadoutBuilderItem)
  .component('loadoutBuilderLocks', LoadoutBuilderLocks)
  .component('loadoutBuilderCharacterSelect', LoadoutBuilderCharacterSelect)
  .component('loadoutBuilderCharacterPopup', LoadoutBuilderCharacterPopup).name;
