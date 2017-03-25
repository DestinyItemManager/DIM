import angular from 'angular';

import recordBooksComponent from './record-books.component';
import recordBooksService from './record-books.service';

export default angular
  // TODO: once bungie service is its own module, add a dependency here
  .module('recordBooksModule', [])
  .service(recordBooksService)
  .component('recordBooks', recordBooksComponent)
  .config(($stateProvider) => {
    'ngInject';

    const states = [{
      name: 'record-books',
      parent: 'content',
      component: 'record-books',
      url: '/recordBooks'
    }];

    states.forEach((state) => {
      $stateProvider.state(state);
    });
  })
  .name;
