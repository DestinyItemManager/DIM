import { StateProvider } from '@uirouter/angularjs';
import { module } from 'angular';
import { react2angular } from 'react2angular';
import Collections from './Collections';

// This is the Destiny 2 "collections" pages
export const collectionsModule = module('d2collectionsModule', [])
  .component('collections', react2angular(Collections, ['account'], ['$scope', '$stateParams', 'D2StoresService', 'dimDestinyTrackerService']))
  .config(($stateProvider: StateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'destiny2.collections',
      component: 'collections',
      url: '/collections'
    });
  })
  .name;
