import { module } from 'angular';

import { LoadoutDrawerComponent } from './loadout-drawer.component';
import { LoadoutPopupComponent } from './loadout-popup.component';
import { react2angular } from 'react2angular';
import RandomLoadoutButton from './random/RandomLoadoutButton';

export default module('loadoutModule', [])
  .component('dimLoadoutPopup', LoadoutPopupComponent)
  .component('loadoutDrawer', LoadoutDrawerComponent)
  .component('randomLoadout', react2angular(RandomLoadoutButton, ['destinyVersion']))
  .name;
