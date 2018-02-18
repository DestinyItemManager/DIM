import { module } from 'angular';
import { AccountComponent } from './account.component';
import { AccountSelectComponent } from './account-select.component';
import { PlatformService } from './platform.service';

export default module('accountsModule', [])
  .factory('dimPlatformService', PlatformService)
  .component('account', AccountComponent)
  .component('accountSelect', AccountSelectComponent)
  .name;
