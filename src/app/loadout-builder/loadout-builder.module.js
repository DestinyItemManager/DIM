import angular from 'angular';

import { LoadoutBuilderComponent } from './loadout-builder.component';
import { LoadoutBuilderItem } from './loadout-builder-item.component';
import { LoadoutBuilderLocks } from './loadout-builder-locks.component';
import { LoadoutBuilderCharacterSelect } from './loadout-builder-character-select.component';
import { LoadoutBuilderCharacterPopup } from './loadout-builder-character-popup.component';

import './loadout-builder.scss';

export default angular
  .module('loadoutBuilderModule', [])
  .component('loadoutBuilder', LoadoutBuilderComponent)
  .component('loadoutBuilderItem', LoadoutBuilderItem)
  .component('loadoutBuilderLocks', LoadoutBuilderLocks)
  .component('loadoutBuilderCharacterSelect', LoadoutBuilderCharacterSelect)
  .component('loadoutBuilderCharacterPopup', LoadoutBuilderCharacterPopup)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'destiny1.loadout-builder',
      component: 'loadoutBuilder',
      url: '/loadout-builder'
    });
  })
  .name;
