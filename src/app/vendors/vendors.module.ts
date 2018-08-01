import { module } from 'angular';

import { VendorsComponent } from './vendors.component';
import { VendorItems } from './vendor-items.component';
import { VendorItem } from './vendor-item.component';
import { VendorCurrencies } from './vendor-currencies.component';
import { vendorTab, vendorTabItems } from './vendors.filters';

export default module('VendorsModule', [])
  .component('dimVendors', VendorsComponent)
  .component('vendorItems', VendorItems)
  .component('vendorItem', VendorItem)
  .component('vendorCurrencies', VendorCurrencies)
  .filter('vendorTab', () => vendorTab)
  .filter('vendorTabItems', () => vendorTabItems)
  .filter('values', () => {
    return (i) => {
      return i ? Object.values(i) : i;
    };
  })
  .name;
