import { DestinyAccount } from 'app/accounts/destiny-account';
import CurrentActivity from 'app/active-mode/CurrentActivity';
import FarmingView from 'app/active-mode/FarmingView';
import PursuitsView from 'app/active-mode/PursuitsView';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import CharacterSelect from 'app/dim-ui/CharacterSelect';
import PageWithMenu from 'app/dim-ui/PageWithMenu';
import CollapsibleItemCategoryContainer from 'app/inventory/CollapsibleItemCategoryContainer';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import InventoryCollapsibleTitle from 'app/inventory/InventoryCollapsibleTitle';
import {
  bucketsSelector,
  currentStoreSelector,
  sortedStoresSelector,
} from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getStore, getVault } from 'app/inventory/stores-helpers';
import LoadoutPopup from 'app/loadout/LoadoutPopup';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { loadAllVendors } from 'app/vendors/actions';
import { VendorsState } from 'app/vendors/reducer';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import '../inventory/Stores.scss';
import './StoresAlt.scss';

interface StoreProps {
  stores: DimStore[];
  currentStore: DimStore;
  defs?: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  isPhonePortrait: boolean;
  vendors: VendorsState['vendorsByCharacter'];
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    defs: state.manifest.d2Manifest,
    stores: sortedStoresSelector(state),
    buckets: bucketsSelector(state)!,
    vendors: state.vendors.vendorsByCharacter,
    isPhonePortrait: state.shell.isPhonePortrait,
    currentStore: currentStoreSelector(state)!,
  };
}

type Props = { account: DestinyAccount } & StoreProps & ThunkDispatchProp;

/**
 * Display current activity, selected character, and entire inventory
 */
function StoresAlt(
  this: void,
  { defs, dispatch, account, vendors, stores, currentStore, buckets, isPhonePortrait }: Props
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
        <CollapsibleItemCategoryContainer
          key={'Postmaster'}
          stores={[selectedStore]}
          currentStore={selectedStore}
          vault={vault}
          category={'Postmaster'}
          buckets={buckets}
          inventoryBucket={buckets.byCategory['Postmaster']}
        />
        <CurrentActivity
          defs={defs}
          vendors={vendors}
          buckets={buckets}
          account={account}
          store={selectedStore}
        />
        <PursuitsView store={selectedStore} defs={defs} />
        <InventoryCollapsibleTitle
          title={'Loadouts'}
          sectionId={'Loadout'}
          stores={[selectedStore]}
        >
          <LoadoutPopup dimStore={selectedStore} hideFarming={true} />
        </InventoryCollapsibleTitle>
        <FarmingView store={selectedStore} />
      </PageWithMenu.Menu>
      <PageWithMenu.Contents className="acivity-inventory">
        <>
          {Object.entries(buckets.byCategory).map(([category, inventoryBucket]) =>
            category === 'Postmaster' ? null : (
              <CollapsibleItemCategoryContainer
                key={category}
                stores={[selectedStore, vault]}
                currentStore={selectedStore}
                vault={vault}
                category={category}
                buckets={buckets}
                inventoryBucket={inventoryBucket}
              />
            )
          )}
        </>
      </PageWithMenu.Contents>
    </PageWithMenu>
  );
}

export default connect<StoreProps>(mapStateToProps)(StoresAlt);
