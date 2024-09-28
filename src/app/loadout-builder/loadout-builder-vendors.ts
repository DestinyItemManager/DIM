import { currentAccountSelector } from 'app/accounts/selectors';
import { DimItem } from 'app/inventory/item-types';
import { VendorHashes } from 'app/search/d2-known-values';
import { emptyArray } from 'app/utils/empty';
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
  VendorHashes.XurLegendaryItems,
];

export const loVendorItemsSelector = currySelector(
  createSelector(characterVendorItemsSelector, (allVendorItems) => {
    const relevantItems = allVendorItems.filter(
      (item) =>
        allowedVendorHashes.includes(item.vendor?.vendorHash ?? -1) &&
        // filters out some dummy exotics
        item.bucket.hash !== -1,
    );
    // some signs that vendor items aren't yet loaded. to prevent recalcs, only add in vendor items once they're all ready
    return !relevantItems.length || relevantItems.some((i) => i.missingSockets === 'not-loaded')
      ? emptyArray<DimItem>()
      : relevantItems;
  }),
);

export function useLoVendorItems(selectedStoreId: string) {
  const account = useSelector(currentAccountSelector)!;
  const vendorItems = useSelector(loVendorItemsSelector(selectedStoreId));
  const vendors = useSelector(vendorsByCharacterSelector);

  useLoadVendors(account, selectedStoreId);

  return {
    vendorItems,
    error: vendors[selectedStoreId]?.error,
  };
}
