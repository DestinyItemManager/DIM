import { module } from 'angular';

import { VendorsComponent } from './vendors.component';
import { VendorItems } from './vendor-items.component';
import { VendorItem } from './vendor-item.component';
import { VendorCurrencies } from './vendor-currencies.component';
import { vendorTab, vendorTabItems } from './vendors.filters';
import { Xur } from './xur.component';
import { StateProvider } from '@uirouter/angularjs';

export default module('VendorsModule', [])
  .component('vendors', VendorsComponent)
  .component('vendorItems', VendorItems)
  .component('vendorItem', VendorItem)
  .component('vendorCurrencies', VendorCurrencies)
  .component('xur', Xur)
  .filter('vendorTab', () => vendorTab)
  .filter('vendorTabItems', () => vendorTabItems)
  .filter('values', () => {
    return (i) => {
      return i ? Object.values(i) : i;
    };
  })
  .config(($stateProvider: StateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'destiny1.vendors',
      // TODO: It'd be interesting to separate general and character-specific vendor info
      component: 'vendors',
      url: '/vendors'
    });
  })
  .name;
