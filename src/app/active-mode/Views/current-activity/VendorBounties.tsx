import { DestinyAccount } from 'app/accounts/destiny-account';
import styles from 'app/active-mode/Views/CurrentActivity.m.scss';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { ownedItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import BountyGuide, { BountyFilter } from 'app/progress/BountyGuide';
import { RootState } from 'app/store/types';
import { toVendor } from 'app/vendors/d2-vendors';
import { VendorsState } from 'app/vendors/reducer';
import { VendorItem } from 'app/vendors/vendor-item';
import VendorItemComponent from 'app/vendors/VendorItemComponent';
import { DestinyActivityDefinition } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import pursuitsInfo from 'data/d2/pursuits.json';
import React, { useState } from 'react';
import { connect } from 'react-redux';

interface ProvidedProps {
  defs: D2ManifestDefinitions;
  account: DestinyAccount;
  store: DimStore;
  buckets: InventoryBuckets;
  activity: DestinyActivityDefinition;
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

function bountiesForActivity(bounties: VendorItem[], activity: DestinyActivityDefinition) {
  return bounties.filter(({ item }) => {
    const info = item?.hash && pursuitsInfo[item?.hash];
    if (!info) {
      return false;
    }

    for (const key in info) {
      switch (key) {
        case 'Destination':
          return info[key].includes(activity.placeHash);
        case 'ActivityMode':
          return activity.activityModeHashes.some((modeHash) => info[key].includes(modeHash));
        default:
          return true; //!info['ActivityMode']; // Filter out things like 'Cast your Super' #171761468
      }
    }
  });
}

/** Find relevant vendor bounties based on your current activity */
function VendorBounties({
  defs,
  vendors,
  store,
  activity,
  buckets,
  ownedItemHashes,
  account,
}: Props) {
  const [bountyFilters, setBountyFilters] = useState<BountyFilter[]>([]);

  if (!vendors) {
    return null;
  }

  const bounties: VendorItem[] = [];
  const vendorsResponse = vendors[store.id]?.vendorsResponse;
  if (!vendorsResponse?.vendors.data) {
    return null;
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
      bounties.push(...vendorBounties);
    }
  });

  if (!bounties.length) {
    return null;
  }

  const suggestedBounties = bountiesForActivity(bounties, activity);

  const ownedBounties: VendorItem[] = [];
  const unownedBounties: VendorItem[] = [];
  suggestedBounties.forEach((vendorItem) => {
    vendorItem.item &&
      (ownedItemHashes.has(vendorItem.item.hash) ? ownedBounties : unownedBounties).push(
        vendorItem
      );
  });

  const ownedBountyGuide = ownedBounties
    .map(({ item }) => item ?? undefined)
    .filter((bounties): bounties is DimItem => bounties !== undefined);

  return (
    <>
      {$featureFlags.bountyGuide && (
        <div className={styles.bountyGuide}>
          <BountyGuide
            defs={defs}
            store={store}
            bounties={ownedBountyGuide}
            selectedFilters={bountyFilters}
            onSelectedFiltersChanged={setBountyFilters}
            actionsOnly={true}
          />
        </div>
      )}
      {ownedBounties?.map(
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
      {unownedBounties.length > 0 && <div className={styles.title}>Suggested Bounties</div>}
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
