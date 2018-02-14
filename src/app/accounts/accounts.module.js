import angular from 'angular';
import { BungieAccountService } from './bungie-account.service';
import { DestinyAccountService } from './destiny-account.service';
import { AccountComponent } from './account.component';
import { AccountSelectComponent } from './account-select.component';

export default angular
  .module('accountsModule', [])
  .factory('BungieAccountService', BungieAccountService)
  .factory('DestinyAccountService', DestinyAccountService)
  .component('account', AccountComponent)
  .component('accountSelect', AccountSelectComponent)
  .name;