import * as angular from 'angular';
import { DestinyAccountService } from './destiny-account.service';
import { AccountComponent } from './account.component';
import { AccountSelectComponent } from './account-select.component';
import { PlatformService } from './platform.service';

export default angular
  .module('accountsModule', [])
  .factory('DestinyAccountService', DestinyAccountService)
  .factory('dimPlatformService', PlatformService)
  .component('account', AccountComponent)
  .component('accountSelect', AccountSelectComponent)
  .name;
