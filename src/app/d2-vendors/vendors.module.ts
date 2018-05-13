import { StateProvider } from '@uirouter/angularjs';
import { module } from 'angular';
import { react2angular } from 'react2angular';
import SingleVendor from './SingleVendor';
import Vendors from './Vendors';

// This is the Destiny 2 "Vendors" pages
export const d2VendorsModule = module('d2VendorsModule', [])
  .component('d2Vendors', react2angular(Vendors, ['account'], ['$scope', '$stateParams', 'D2StoresService', 'dimDestinyTrackerService']))
  .component('d2SingleVendor', react2angular(SingleVendor, ['account'], ['$scope', '$stateParams', 'D2StoresService', 'dimDestinyTrackerService']))
  .config(($stateProvider: StateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'destiny2.vendors',
      component: 'd2Vendors',
      url: '/vendors?characterId'
    });

    $stateProvider.state({
      name: 'destiny2.vendor',
      component: 'd2SingleVendor',
      url: '/vendors/:id?characterId'
    });
  })
  .name;
