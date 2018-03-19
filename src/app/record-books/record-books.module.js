import angular from 'angular';
import 'angular-duration-format';

import { RecordBooksComponent } from './record-books.component';

export default angular
  .module('recordBooksModule', ['angular-duration-format'])
  .component('recordBooks', RecordBooksComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'destiny1.record-books',
      component: 'recordBooks',
      url: '/record-books'
    });
  })
  .name;
