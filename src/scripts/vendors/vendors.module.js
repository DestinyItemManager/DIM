import angular from 'angular';
import _ from 'underscore';

import { VendorService } from './vendor.service';
import { XurService } from './xur.service';
import { VendorsComponent } from './vendors.component';
import { VendorItems } from './vendor-items.component';
import { VendorItem } from './vendor-item.component';
import { VendorCurrencies } from './vendor-currencies.component';
import { vendorTab, vendorTabItems } from './vendors.filters';
import { XurController } from './xur.controller';

export default angular
  // TODO: once bungie service is its own module, add a dependency here
  .module('VendorsModule', [])
  .factory('dimVendorService', VendorService)
  .factory('dimXurService', XurService)
  .component('vendors', VendorsComponent)
  .component('vendorItems', VendorItems)
  .component('vendorItem', VendorItem)
  .component('vendorCurrencies', VendorCurrencies)
  .controller('dimXurCtrl', XurController)
  .filter('vendorTab', () => vendorTab)
  .filter('vendorTabItems', () => vendorTabItems)
  .filter('values', () => _.values)
  .config(($stateProvider) => {
    'ngInject';

    const states = [{
      name: 'vendors',
      parent: 'content',
      component: 'vendors',
      url: '/vendors'
    }];

    states.forEach((state) => {
      $stateProvider.state(state);
    });
  })
  .name;
