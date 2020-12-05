import { DestinyAccount } from 'app/accounts/destiny-account';
import { currentAccountSelector } from 'app/accounts/selectors';
import { getCurrentActivity } from 'app/bungie-api/destiny2-api';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { bucketsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { refresh } from 'app/shell/refresh';
import { RootState } from 'app/store/types';
import { toVendor } from 'app/vendors/d2-vendors';
import { VendorItem } from 'app/vendors/vendor-item';
import { DestinyCharacterActivitiesComponent } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import pursuitsInfo from 'data/d2/pursuits.json';
import { useEffect, useRef, useState } from 'react';
import { createSelector } from 'reselect';

const ACTIVITY_REFRESH_RATE = 10_000;
let cooldown = Date.now();
let intervalId = 0;
let firstLoad = true;

async function refreshActivity({ account, store }: { account: DestinyAccount; store: DimStore }) {
  const profileInfo = await getCurrentActivity(account, store.id);
  return profileInfo.activities.data;
}

export function useActivityInfo({ account, store }: { account: DestinyAccount; store: DimStore }) {
  const [activityInfo, setActivityInfo] = useState<
    DestinyCharacterActivitiesComponent | undefined
  >();
  const prevActivityInfo = useRef<DestinyCharacterActivitiesComponent | undefined>();

  useEffect(() => {
    if (firstLoad) {
      refreshActivity({ account, store }).then(setActivityInfo);
    }

    window.clearInterval(intervalId);
    intervalId = window.setInterval(() => {
      // If the activity mode just changed, trust the new one and don't ping for a little.
      // Sometimes there is a weird cache issue, where even after some time it flips back and forth with the last
      if (Date.now() - cooldown < ACTIVITY_REFRESH_RATE * 6) {
        return;
      }

      refreshActivity({ account, store }).then(setActivityInfo);
    }, ACTIVITY_REFRESH_RATE);

    return () => {
      window.clearInterval(intervalId);
      firstLoad = true;
    };
  }, [account, store]);

  useEffect(() => {
    if (!activityInfo) {
      return;
    }
    if (
      !firstLoad &&
      prevActivityInfo.current?.currentActivityHash !== activityInfo.currentActivityHash
    ) {
      refresh();
      cooldown = Date.now();
    }
    firstLoad = false;
    prevActivityInfo.current = activityInfo;
  }, [activityInfo]);

  return activityInfo;
}

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
  const activity =
    activityInfo.currentActivityHash && defs.Activity.get(activityInfo.currentActivityHash);
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

    const matchingDestination = activity && info.Destination?.includes(activity.destinationHash);
    const matchingActivity =
      (!info.Destination && info.ActivityMode?.includes(activityMode?.hash)) ||
      activityMode?.parentHashes.some((hash) => info.ActivityMode?.includes(hash));

    return matchingDestination || matchingActivity;
  });
}
