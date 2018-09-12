import { module } from 'angular';

import { FarmingComponent } from './farming.component';
import { D2FarmingComponent } from './d2farming.component';

export default module('farmingModule', [])
  .component('dimFarming', FarmingComponent)
  .component('d2Farming', D2FarmingComponent).name;
