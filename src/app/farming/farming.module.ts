import { module } from 'angular';

import { FarmingComponent } from './farming.component';
import { FarmingService } from './farming.service';
import { D2FarmingComponent } from './d2farming.component';
import { D2FarmingService } from './d2farming.service';

export default module('farmingModule', [])
  .component('dimFarming', FarmingComponent)
  .factory('dimFarmingService', FarmingService)
  .component('d2Farming', D2FarmingComponent)
  .factory('D2FarmingService', D2FarmingService)
  .name;
