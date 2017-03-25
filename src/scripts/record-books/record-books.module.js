import angular from 'angular';

import { RecordBooksComponent } from './record-books.component';

export default angular
  // TODO: once bungie service is its own module, add a dependency here
  .module('recordBooksModule', [])
  .component('recordBooks', RecordBooksComponent)
  .config(($stateProvider) => {
    'ngInject';

    const states = [{
      name: 'record-books',
      parent: 'content',
      component: 'recordBooks',
      url: '/record-books'
    }];

    states.forEach((state) => {
      $stateProvider.state(state);
    });
  })
  .name;
