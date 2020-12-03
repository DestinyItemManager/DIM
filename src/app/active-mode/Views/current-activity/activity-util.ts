import { currentAccountSelector } from 'app/accounts/selectors';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { bucketsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { RootState } from 'app/store/types';
import { toVendor } from 'app/vendors/d2-vendors';
import { VendorItem } from 'app/vendors/vendor-item';
import { DestinyCharacterActivitiesComponent } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import pursuitsInfo from 'data/d2/pursuits.json';
import { createSelector } from 'reselect';

export const purchasableBountiesSelector = (store: DimStore) =>
  createSelector(
    bucketsSelector,
    currentAccountSelector,
    (state: RootState) => state.vendors.vendorsByCharacter[store.id]?.vendorsResponse,
    (state: RootState) => state.manifest.d2Manifest,
    (buckets, account, vendorsResponse, defs) => {
      if (!vendorsResponse) {
        return [];
      }

      const { vendors, sales, itemComponents } = vendorsResponse;

      if (!account || !defs || !buckets || !vendors.data) {
        return [];
      }

      const purchasableBounties: VendorItem[] = [];
      for (const vendor of Object.values(vendors.data)) {
        const { vendorHash } = vendor;
        const d2Vendor = toVendor(
          vendorHash,
          defs,
          buckets,
          vendor,
          account,
          itemComponents[vendorHash],
          sales.data?.[vendorHash]?.saleItems,
          {}
        );

        d2Vendor &&
          purchasableBounties.push(
            ...d2Vendor.items.filter(
              ({ item, canPurchase, canBeSold }: VendorItem) =>
                canPurchase &&
                canBeSold &&
                item?.itemCategoryHashes.includes(ItemCategoryHashes.Bounties)
            )
          );
      }

      return purchasableBounties;
    }
  );

export function getBountiesForActivity(
  defs: D2ManifestDefinitions,
  bounties: VendorItem[],
  activityInfo: DestinyCharacterActivitiesComponent
) {
  const activity = defs.Activity.get(activityInfo.currentActivityHash);
  const activityMode = defs.ActivityMode[activityInfo.currentActivityModeHash];

  return bounties.filter(({ item }) => {
    const info = item?.hash && pursuitsInfo[item?.hash];

    if (!info) {
      // Until the pursuits.json matches all bounties, we need to return falsy
      return false;
    }

    if (!info?.ActivityMode && !info?.Destination) {
      // Show all bounties that can be completed anywhere
      return true;
    }

    const matchingDestination = info.Destination?.includes(activity?.destinationHash);
    const matchingActivity =
      (!info.Destination && info.ActivityMode?.includes(activityMode?.hash)) ||
      activityMode?.parentHashes.some((hash) => info.ActivityMode?.includes(hash));

    return matchingDestination || matchingActivity;
  });
}
