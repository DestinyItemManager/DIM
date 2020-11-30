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
import { DestinyActivityDefinition } from 'bungie-api-ts/destiny2';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import pursuitsInfo from 'data/d2/pursuits.json';
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
  activity: DestinyActivityDefinition
) {
  return bounties.filter(({ item }) => {
    const info = item?.hash && pursuitsInfo[item?.hash];
    if (!info) {
      return false;
    }

    for (const key in info) {
      switch (key) {
        case 'Destination':
          return info[key].includes(activity.destinationHash);
        case 'ActivityMode':
          // eslint-disable-next-line no-extra-boolean-cast
          return Boolean(activity.activityModeHashes)
            ? activity.activityModeHashes.some((modeHash) => info[key].includes(modeHash))
            : info[key].includes(defs.ActivityMode[activity.activityTypeHash]);
        default:
          return !info['ActivityMode']; // Filter out other activity specific bounties
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

  const suggestedBounties = bountiesForActivity(defs, bounties, activity);

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

  const ownedPursuits = store.items.filter(({ hash }) => ownedBountyHashes.includes(hash));

  return (
    <>
      <div className={styles.bountyGuide}>
        <PursuitsGroup defs={defs} store={store} pursuits={ownedPursuits} hideDescriptions />
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
