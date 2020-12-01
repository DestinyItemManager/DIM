import { DestinyAccount } from 'app/accounts/destiny-account';
import styles from 'app/active-mode/Views/CurrentActivity.m.scss';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { ownedItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { PursuitsGroup } from 'app/progress/Pursuits';
import { RootState } from 'app/store/types';
import { toVendor } from 'app/vendors/d2-vendors';
import { VendorsState } from 'app/vendors/reducer';
import { VendorItem } from 'app/vendors/vendor-item';
import VendorItemComponent from 'app/vendors/VendorItemComponent';
import { DestinyCharacterActivitiesComponent } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import pursuitsInfo from 'data/d2/pursuits.json';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

interface ProvidedProps {
  defs: D2ManifestDefinitions;
  account: DestinyAccount;
  store: DimStore;
  buckets: InventoryBuckets;
  activityInfo: DestinyCharacterActivitiesComponent;
}

interface StoreProps {
  ownedItemHashes: Set<number>;
  vendors: VendorsState['vendorsByCharacter'];
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  const ownedItemSelectorInstance = ownedItemsSelector();
  return {
    ownedItemHashes: ownedItemSelectorInstance(state),
    vendors: state.vendors.vendorsByCharacter,
  };
}

function bountiesForActivity(
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

/** Find relevant vendor bounties based on your current activity */
function VendorBounties({
  defs,
  vendors,
  store,
  activityInfo,
  buckets,
  ownedItemHashes,
  account,
}: Props) {
  const [suggestedBounties, setSuggestedBounties] = useState<VendorItem[]>([]);
  const [bounties, setBounties] = useState<VendorItem[]>([]);

  useEffect(() => {
    if (!vendors) {
      return;
    }
    const purchasableBounties: VendorItem[] = [];
    const vendorsResponse = vendors[store.id]?.vendorsResponse;
    if (!vendorsResponse?.vendors.data) {
      return;
    }

    Object.values(vendorsResponse.vendors.data).forEach((vendor) => {
      const { vendorHash } = vendor;
      const d2Vendor = toVendor(
        vendorHash,
        defs,
        buckets,
        vendor,
        account,
        vendorsResponse?.itemComponents[vendorHash],
        vendorsResponse?.sales.data?.[vendorHash]?.saleItems,
        {}
      );
      const vendorBounties = d2Vendor?.items.filter(
        ({ item, canPurchase, canBeSold }: VendorItem) =>
          canPurchase && canBeSold && item?.itemCategoryHashes.includes(ItemCategoryHashes.Bounties)
      );

      if (vendorBounties) {
        purchasableBounties.push(...vendorBounties);
      }
    });

    setBounties(purchasableBounties);
  }, [defs, account, buckets, store, vendors]);

  useEffect(() => {
    setSuggestedBounties(bountiesForActivity(defs, bounties, activityInfo));
  }, [defs, bounties, activityInfo]);

  const ownedBountyHashes: number[] = [];
  const unownedBounties: VendorItem[] = [];
  suggestedBounties.forEach((vendorItem) => {
    if (!vendorItem.item) {
      return;
    }
    if (ownedItemHashes.has(vendorItem.item.hash)) {
      ownedBountyHashes.push(vendorItem.item.hash);
    } else {
      unownedBounties.push(vendorItem);
    }
  });

  const ownedIncompletePursuits = store.items
    .filter(({ hash }) => ownedBountyHashes.includes(hash))
    .filter(
      ({ complete, pursuit }) =>
        ((!complete && pursuit?.expirationDate?.getTime()) ?? 0) > Date.now()
    );

  return (
    <>
      <div className={styles.bountyGuide}>
        <PursuitsGroup
          defs={defs}
          store={store}
          pursuits={ownedIncompletePursuits}
          skipTypes={['ActivityMode', 'Destination']}
          hideDescriptions
        />
      </div>
      {unownedBounties.length > 0 && (
        <div className={styles.title}>{t('ActiveMode.SuggestedBounties')}</div>
      )}
      {unownedBounties.map(
        (item: VendorItem) =>
          item.item && (
            <VendorItemComponent
              key={item.key}
              defs={defs}
              item={item}
              owned={false}
              characterId={store.id}
            />
          )
      )}
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(VendorBounties);
