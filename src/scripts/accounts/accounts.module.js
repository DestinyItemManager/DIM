import angular from 'angular';
import bungieApiModule from '../bungie-api/bungie-api.module';
import { BungieAccountService } from './bungie-account.service';
import { DestinyAccountService } from './destiny-account.service';
import { AccountSelectComponent } from './account-select.component';

export default angular
  .module('accountsModule', [bungieApiModule])
  .factory('BungieAccountService', BungieAccountService)
  .factory('DestinyAccountService', DestinyAccountService)
  .component('accountSelect', AccountSelectComponent)
  .name;