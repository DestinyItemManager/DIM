import { DestinyAccount } from 'app/accounts/destiny-account';
import RestStoresBucket from 'app/active-mode/RestStoresBucket';
import CurrentActivity from 'app/active-mode/Views/CurrentActivity';
import FarmingView from 'app/active-mode/Views/FarmingView';
import LoadoutView from 'app/active-mode/Views/LoadoutView';
import PostmasterView from 'app/active-mode/Views/PostmasterView';
import PursuitsView from 'app/active-mode/Views/PursuitsView';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import { t } from 'app/i18next-t';
import { InventoryBucket, InventoryBuckets } from 'app/inventory/inventory-buckets';
import {
  bucketsSelector,
  currentStoreSelector,
  sortedStoresSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import StoreBucket from 'app/inventory/StoreBucket';
import { findItemsByBucket, getStore, getVault } from 'app/inventory/stores-helpers';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { loadAllVendors } from 'app/vendors/actions';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import '../inventory/Stores.scss';
import styles from './ActiveMode.m.scss';

interface StoreProps {
  buckets: InventoryBuckets;
  currentStore: DimStore;
  isPhonePortrait: boolean;
  stores: DimStore[];
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    buckets: bucketsSelector(state)!,
    currentStore: currentStoreSelector(state)!,
    isPhonePortrait: state.shell.isPhonePortrait,
    stores: sortedStoresSelector(state),
  };
}

type Props = { account: DestinyAccount } & StoreProps & ThunkDispatchProp;

/**
 * Display current activity, selected character, and entire inventory
 */
function ActiveMode(
  this: void,
  { dispatch, account, stores, currentStore, buckets, isPhonePortrait }: Props
) {
  const vault = getVault(stores)!;
  const [selectedStoreId, setSelectedStoreId] = useState(currentStore?.id);
  const [selectedStore, setSelectedStore] = useState<DimStore>(currentStore);

  useEffect(() => {
    dispatch(loadAllVendors(account, selectedStoreId));
  }, [account, selectedStoreId, dispatch]);

  useEffect(() => {
    setSelectedStore(getStore(stores, selectedStoreId)!);
  }, [stores, selectedStoreId]);

  if (!stores.length || !buckets) {
    return null;
  }

  return (
    <PageWithMenu
      className={`inventory-content phone-portrait destiny${selectedStore.destinyVersion}`}
    >
      <PageWithMenu.Menu className={styles.activityColumn}>
        {selectedStore && (
          <CharacterSelect
            stores={stores}
            isPhonePortrait={isPhonePortrait}
            selectedStore={selectedStore}
            onCharacterChanged={setSelectedStoreId}
          />
        )}
        <div className={styles.activitySplit}></div>
        <CurrentActivity account={account} store={selectedStore} buckets={buckets} />
        <PostmasterView store={selectedStore} vault={vault} buckets={buckets} />
        <PursuitsView store={selectedStore} />
        <LoadoutView store={selectedStore} />
        <FarmingView store={selectedStore} />
      </PageWithMenu.Menu>
      <PageWithMenu.Contents className={styles.activityInventory}>
        <>
          {Object.entries(buckets.byCategory).map(([category, inventoryBucket]) =>
            category === 'Postmaster' ? null : (
              <CollapsibleTitle
                key={category}
                className="store-row inventory-title"
                title={t(`Bucket.${category}`)}
                sectionId={category}
                defaultCollapsed={true}
              >
                {inventoryBucket.map((bucket) => (
                  <ActiveModeStoreBuckets
                    key={bucket.hash}
                    bucket={bucket}
                    stores={stores}
                    currentStore={category === 'Inventory' ? currentStore : selectedStore}
                    isPhonePortrait={isPhonePortrait}
                  />
                ))}
              </CollapsibleTitle>
            )
          )}
        </>
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}

export default connect<StoreProps>(mapStateToProps)(ActiveMode);

function ActiveModeStoreBuckets({
  bucket,
  stores,
  currentStore,
  isPhonePortrait,
}: {
  bucket: InventoryBucket;
  stores: DimStore[];
  currentStore: DimStore;
  isPhonePortrait: boolean;
}) {
  // Don't show buckets with no items
  if (
    (!bucket.hasTransferDestination && bucket.type !== 'Class' && bucket.type !== 'Emblems') ||
    ((!bucket.accountWide || bucket.type === 'SpecialOrders') &&
      !stores.some((s) => findItemsByBucket(s, bucket.hash).length > 0))
  ) {
    return null;
  }

  return (
    <div
      className={clsx(`store-row bucket-${bucket.hash}`, {
        [styles.inventoryCategory]: bucket.sort === 'Inventory',
      })}
    >
      <div className={'store-cell'}>
        <StoreBucket bucket={bucket} store={currentStore} />
      </div>
      {!isPhonePortrait && (
        <div className={'store-cell'}>
          <RestStoresBucket bucket={bucket} currentStore={currentStore} />
        </div>
      )}
    </div>
  );
}
