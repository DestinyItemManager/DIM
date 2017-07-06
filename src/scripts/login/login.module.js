import angular from 'angular';

import { LoginComponent } from './login.component';

export default angular
  .module('loginModule', [])
  .component('login', LoginComponent)
  .config(($stateProvider) => {
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
