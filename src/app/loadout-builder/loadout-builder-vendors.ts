import { currentAccountSelector } from 'app/accounts/selectors';
import { VendorHashes } from 'app/search/d2-known-values';
import { currySelector } from 'app/utils/selectors';
import { useLoadVendors } from 'app/vendors/hooks';
import { characterVendorItemsSelector, vendorsByCharacterSelector } from 'app/vendors/selectors';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

/**
 * Everything is a vendor and everything is an item, so tons of "vendors" will
 * constantly sell "items" that somewhat look like armor but actually aren't.
 * Maybe there's a good way to figure out which is which -- going with an explicit
 * allow-list of vendors for now.
 */
const allowedVendorHashes = [
  VendorHashes.AdaTransmog,
  VendorHashes.Xur,
  VendorHashes.DevrimKay,
  VendorHashes.Failsafe,
  VendorHashes.RivensWishesExotics,
];

export const loVendorItemsSelector = currySelector(
  createSelector(characterVendorItemsSelector, (allVendorItems) =>
    allVendorItems.filter((item) => allowedVendorHashes.includes(item.vendor?.vendorHash ?? -1)),
  ),
);

export function useLoVendorItems(selectedStoreId: string) {
  const account = useSelector(currentAccountSelector)!;
  const vendorItems = useSelector(loVendorItemsSelector(selectedStoreId));
  const vendors = useSelector(vendorsByCharacterSelector);

  useLoadVendors(account, selectedStoreId);

  return {
    vendorItemsLoading: !vendors[selectedStoreId]?.vendorsResponse,
    vendorItems,
    error: vendors[selectedStoreId]?.error,
  };
}
