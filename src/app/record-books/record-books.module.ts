import { module } from 'angular';
import 'angular-duration-format';

import { RecordBooksComponent } from './record-books.component';
import { StateProvider } from '@uirouter/angularjs';

export default module('recordBooksModule', ['angular-duration-format'])
  .component('recordBooks', RecordBooksComponent)
  .config(($stateProvider: StateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'destiny1.record-books',
      component: 'recordBooks',
      url: '/record-books'
    });
  })
  .name;
