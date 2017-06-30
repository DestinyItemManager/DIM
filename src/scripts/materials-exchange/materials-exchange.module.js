import angular from 'angular';

import { Section } from './dimCollapsible.directive';
import { MaterialsExchangeComponent } from './materials-exchange.component';

export default angular
  .module('MaterialsExchangeModule', [])
  .component('materialsExchange', MaterialsExchangeComponent)
  .directive('dimCollapsibleSection', Section)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'materials-exchange',
      parent: 'content',
      url: '/materials-exchange',
      component: 'materialsExchange'
    });
  })
  .name;
