import angular from 'angular';

import { LoadoutService } from './loadout.service';
import { LoadoutDrawerComponent } from './loadout-drawer.component';
import { LoadoutPopupComponent } from './loadout-popup.component';
import { RandomLoadoutComponent } from './random/random-loadout.component';

export default angular
  .module('loadoutModule', [])
  .factory('dimLoadoutService', LoadoutService)
  .component('dimLoadoutPopup', LoadoutPopupComponent)
  .component('loadoutDrawer', LoadoutDrawerComponent)
  .component('randomLoadout', RandomLoadoutComponent)
  .name;
