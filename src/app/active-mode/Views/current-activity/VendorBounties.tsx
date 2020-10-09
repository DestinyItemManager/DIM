import { DestinyAccount } from 'app/accounts/destiny-account';
import {
  Vendors,
  vendorsByActivityModeType,
  vendorsByDestinationHash,
} from 'app/active-mode/Views/current-activity/util';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { ownedItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { RootState } from 'app/store/types';
import { toVendor } from 'app/vendors/d2-vendors';
import { VendorsState } from 'app/vendors/reducer';
import { VendorItem } from 'app/vendors/vendor-item';
import VendorItemComponent from 'app/vendors/VendorItemComponent';
import { DestinyActivityDefinition } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
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

function mapStateToProps(state: RootState): StoreProps {
  const ownedItemSelectorInstance = ownedItemsSelector();
  return {
    ownedItemHashes: ownedItemSelectorInstance(state),
    vendors: state.vendors.vendorsByCharacter,
  };
}

type Props = ProvidedProps & StoreProps;

/** Find unclaimed vendor bounties based on your current activity */
function VendorBounties({
  defs,
  vendors,
  store,
  activity,
  buckets,
  ownedItemHashes,
  account,
}: Props) {
  if (!vendors) {
    return null;
  }

  const bounties: VendorItem[] = [];
  const vendorData = store.id ? vendors[store.id] : undefined;
  const vendorsResponse = vendorData?.vendorsResponse;
  const vendorHashes: Vendors[] = [];
  activity.activityModeTypes?.forEach((modeType) => {
    const vendors = vendorsByActivityModeType[modeType];
    vendors && vendorHashes.push(...vendors);
  });

  if (!vendorHashes.length) {
    const vendors = vendorsByDestinationHash[activity.placeHash];
    vendors && vendorHashes.push(...vendors);
  }

  vendorHashes.forEach((vendorHash) => {
    const vendor = vendorsResponse?.vendors.data?.[vendorHash];
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
    const vendorBounties = d2Vendor?.items.filter(({ item }: VendorItem) =>
      item?.itemCategoryHashes.includes(ItemCategoryHashes.Bounties)
    );

    if (vendorBounties) {
      bounties.push(...vendorBounties);
    }
  });

  return (
    <>
      {bounties?.map(
        (item: VendorItem) =>
          item.item &&
          !ownedItemHashes.has(item.item.hash) && (
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
