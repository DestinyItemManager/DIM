import angular from 'angular';

import { BungieServiceHelper } from './bungie-service-helper.service';
import { BungieUserApi } from './bungie-user-api.service';
import { Destiny1Api } from './destiny1-api.service';

export default angular
  .module('BungieApi', [])
  .factory('BungieServiceHelper', BungieServiceHelper)
  .factory('BungieUserApi', BungieUserApi)
  .factory('Destiny1Api', Destiny1Api)
  .name;
