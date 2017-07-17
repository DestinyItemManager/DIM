import angular from 'angular';

import { FarmingComponent } from './farming.component';
import { FarmingService } from './farming.service';

export default angular
  .module('farmingModule', [])
  .component('dimFarming', FarmingComponent)
  .factory('dimFarmingService', FarmingService)
  .name;
