import { module } from 'angular';

import { LoginComponent } from './login.component';
import { StateProvider } from '@uirouter/angularjs';

export default module('loginModule', [])
  .component('login', LoginComponent)
  .config(($stateProvider: StateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'login',
      url: '/login',
      component: 'login',
      params: {
        reauth: false
      }
    });
  })
  .name;
