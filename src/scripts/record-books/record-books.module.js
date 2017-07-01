import angular from 'angular';
import 'angular-duration-format';

import bungieApiModule from '../bungie-api/bungie-api.module';
import { RecordBooksComponent } from './record-books.component';

export default angular
  .module('recordBooksModule', ['angular-duration-format', bungieApiModule])
  .component('recordBooks', RecordBooksComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'record-books',
      parent: 'content',
      component: 'recordBooks',
      url: '/record-books'
    });
  })
  .name;
