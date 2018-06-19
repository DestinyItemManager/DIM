import { module } from 'angular';

import { LoadoutDrawerComponent } from './loadout-drawer.component';
import { LoadoutPopupComponent } from './loadout-popup.component';
import { RandomLoadoutComponent } from './random/random-loadout.component';

export default module('loadoutModule', [])
  .component('dimLoadoutPopup', LoadoutPopupComponent)
  .component('loadoutDrawer', LoadoutDrawerComponent)
  .component('randomLoadout', RandomLoadoutComponent)
  .name;
