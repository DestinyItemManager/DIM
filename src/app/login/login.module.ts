import { module } from 'angular';

import { LoginComponent } from './login.component';

export default module('loginModule', [])
  .component('dimLogin', LoginComponent)
  .name;
