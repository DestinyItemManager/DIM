import { module } from 'angular';
import { AccountComponent } from './account.component';
import { AccountSelectComponent } from './account-select.component';

export default module('accountsModule', [])
  .component('account', AccountComponent)
  .component('accountSelect', AccountSelectComponent)
  .name;
