import { DestinyAccount } from 'app/accounts/destiny-account';
import {
  getBountiesForActivity,
  purchasableBountiesSelector,
} from 'app/active-mode/Views/activity-util';
import styles from 'app/active-mode/Views/CurrentActivity.m.scss';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { ownedItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { PursuitsGroup } from 'app/progress/Pursuits';
import { RootState } from 'app/store/types';
import { VendorItem } from 'app/vendors/vendor-item';
import { DestinyCharacterActivitiesComponent } from 'bungie-api-ts/destiny2';
import React from 'react';
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
  bounties: VendorItem[];
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  const ownedItemSelectorInstance = ownedItemsSelector();
  const purchasableBountiesInstance = purchasableBountiesSelector(props.store);

  return {
    ownedItemHashes: ownedItemSelectorInstance(state),
    bounties: purchasableBountiesInstance(state),
  };
}

/** Find relevant vendor bounties based on your current activity */
function VendorBounties({ defs, bounties, store, activityInfo, ownedItemHashes }: Props) {
  const suggestedBounties = getBountiesForActivity(defs, bounties, activityInfo);

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
        <>
          <div className={styles.title}>{t('ActiveMode.SuggestedBounties')}</div>
          <div className={styles.suggestedBounties}>
            {unownedBounties.map(
              (item: VendorItem) =>
                item.item && (
                  <ItemPopupTrigger key={item.item.id} item={item.item}>
                    {(ref, onClick) => (
                      <ConnectedInventoryItem
                        item={item.item!}
                        allowFilter={true}
                        innerRef={ref}
                        onClick={onClick}
                      />
                    )}
                  </ItemPopupTrigger>
                )
            )}
          </div>
        </>
      )}
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(VendorBounties);
