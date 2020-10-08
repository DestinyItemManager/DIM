import { DestinyAccount } from 'app/accounts/destiny-account';
import CurrentActivity from 'app/active-mode/Views/CurrentActivity';
import FarmingView from 'app/active-mode/Views/FarmingView';
import LoadoutView from 'app/active-mode/Views/LoadoutView';
import PostmasterView from 'app/active-mode/Views/PostmasterView';
import PursuitsView from 'app/active-mode/Views/PursuitsView';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import {
  bucketsSelector,
  currentStoreSelector,
  sortedStoresSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { StoreBuckets } from 'app/inventory/StoreBuckets';
import { getStore, getVault } from 'app/inventory/stores-helpers';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { loadAllVendors } from 'app/vendors/actions';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import '../inventory/Stores.scss';
import './StoresAlt.scss';

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
function StoresAlt(
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
      <PageWithMenu.Menu className="activity-column">
        {selectedStore && (
          <CharacterSelect
            stores={stores}
            vertical={!isPhonePortrait}
            isPhonePortrait={isPhonePortrait}
            selectedStore={selectedStore}
            onCharacterChanged={setSelectedStoreId}
          />
        )}
        <CurrentActivity account={account} store={selectedStore} buckets={buckets} />
        <PostmasterView store={selectedStore} vault={vault} buckets={buckets} />
        <PursuitsView store={selectedStore} />
        <LoadoutView store={selectedStore} />
        <FarmingView store={selectedStore} />
      </PageWithMenu.Menu>
      <PageWithMenu.Contents className="acivity-inventory">
        <>
          {Object.entries(buckets.byCategory).map(([category, inventoryBucket]) =>
            category === 'Postmaster' ? null : (
              <CollapsibleTitle
                className={'store-row inventory-title'}
                title={t(`Bucket.${category}`)}
                sectionId={category}
                defaultCollapsed={true}
              >
                {inventoryBucket.map((bucket) => (
                  <StoreBuckets
                    key={bucket.hash}
                    bucket={bucket}
                    stores={stores}
                    vault={vault}
                    currentStore={selectedStore}
                    isPhonePortrait={isPhonePortrait}
                    altMode={true}
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

export default connect<StoreProps>(mapStateToProps)(StoresAlt);
