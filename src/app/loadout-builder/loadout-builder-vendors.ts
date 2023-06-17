import { currentAccountSelector } from 'app/accounts/selectors';
import { DimItem } from 'app/inventory/item-types';
import { VENDORS } from 'app/search/d2-known-values';
import { emptyArray } from 'app/utils/empty';
import { currySelector } from 'app/utils/selector-utils';
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
  VENDORS.ADA_TRANSMOG,
  VENDORS.XUR,
  VENDORS.DEVRIM_KAY,
  VENDORS.FAILSAFE,
];

const loVendorItemsSelector = currySelector(
  createSelector(characterVendorItemsSelector, (allVendorItems) =>
    allVendorItems.filter((item) => allowedVendorHashes.includes(item.vendor?.vendorHash ?? -1))
  )
);

export function useLoVendorItems(selectedStoreId: string, includeVendorItems: boolean) {
  const account = useSelector(currentAccountSelector)!;
  const vendorItems = useSelector(loVendorItemsSelector(selectedStoreId));
  const vendors = useSelector(vendorsByCharacterSelector);

  useLoadVendors(account, selectedStoreId, /* active */ includeVendorItems);

  return {
    vendorItemsLoading: includeVendorItems && !vendors[selectedStoreId]?.vendorsResponse,
    vendorItems: includeVendorItems ? vendorItems : emptyArray<DimItem>(),
  };
}
