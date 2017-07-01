import angular from 'angular';
import { BungieAccountService } from './bungie-account.service';
import { DestinyAccountService } from './destiny-account.service';
import bungieApiModule from '../bungie-api/bungie-api.module';

export default angular
  .module('accountsModule', [bungieApiModule])
  .factory('BungieAccountService', BungieAccountService)
  .factory('DestinyAccountService', DestinyAccountService)
  .name;