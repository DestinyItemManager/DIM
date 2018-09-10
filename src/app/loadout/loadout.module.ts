import { module } from 'angular';

import { LoadoutDrawerComponent } from './loadout-drawer.component';
import { LoadoutPopupComponent } from './loadout-popup.component';

export default module('loadoutModule', [])
  .component('dimLoadoutPopup', LoadoutPopupComponent)
  .component('loadoutDrawer', LoadoutDrawerComponent)
  .name;
