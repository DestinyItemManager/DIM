import angular from 'angular';
import _ from 'underscore';

import bungieApiModule from '../bungie-api/bungie-api.module';
import { VendorService } from './vendor.service';
import { XurService } from './xur.service';
import { VendorsComponent } from './vendors.component';
import { VendorItems } from './vendor-items.component';
import { VendorItem } from './vendor-item.component';
import { VendorCurrencies } from './vendor-currencies.component';
import { vendorTab, vendorTabItems } from './vendors.filters';
import { Xur } from './xur.component';

export default angular
  .module('VendorsModule', [bungieApiModule])
  .factory('dimVendorService', VendorService)
  .factory('dimXurService', XurService)
  .component('vendors', VendorsComponent)
  .component('vendorItems', VendorItems)
  .component('vendorItem', VendorItem)
  .component('vendorCurrencies', VendorCurrencies)
  .component('xur', Xur)
  .filter('vendorTab', () => vendorTab)
  .filter('vendorTabItems', () => vendorTabItems)
  .filter('values', () => _.values)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'vendors',
      // TODO: It'd be interesting to separate general and character-specific vendor info
      parent: 'destiny1account',
      component: 'vendors',
      url: '/vendors'
    });
  })
  .name;
