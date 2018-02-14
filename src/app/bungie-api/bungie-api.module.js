import angular from 'angular';

import { Destiny1Api } from './destiny1-api.service';
import { Destiny2Api } from './destiny2-api.service';

export default angular
  .module('BungieApi', [])
  .factory('Destiny1Api', Destiny1Api)
  .factory('Destiny2Api', Destiny2Api)
  .name;
