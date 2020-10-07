import { startFarming, stopFarming } from 'app/farming/actions';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import InventoryCollapsibleTitle from 'app/inventory/InventoryCollapsibleTitle';
import { DimItem } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { allItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

interface ProvidedProps {
  store: DimStore;
}

interface StoreProps {
  newItems: DimItem[];
}

const newItemsToShow = 8;

function mapStateToProps(state: RootState): StoreProps {
  const allItems = allItemsSelector(state);
  const items = Array.from(state.inventory.newItems);
  items.length = newItemsToShow;

  const newItems: DimItem[] = [];
  items.forEach((id) => {
    const newItem = allItems.find((item) => item.id === id);
    newItem && newItems.push(newItem);
  });
  newItems.length = newItemsToShow;

  return {
    newItems,
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

function FarmingView({ store, newItems, dispatch }: Props) {
  const [isFarming, setIsFarming] = useState(false);

  useEffect(() => {
    dispatch((isFarming ? startFarming : stopFarming)(store.id));
  }, [dispatch, store, isFarming]);

  return (
    <InventoryCollapsibleTitle
      className="farming-view"
      title={'Recent Items'}
      sectionId={'Farming'}
      stores={[store]}
      defaultCollapsed={true}
    >
      <div className={'new-items'}>
        {newItems.map((item) => (
          <ItemPopupTrigger key={item.id} item={item} keepNew={true}>
            {(ref, onClick) => (
              <ConnectedInventoryItem
                item={item}
                allowFilter={true}
                innerRef={ref}
                onClick={onClick}
              />
            )}
          </ItemPopupTrigger>
        ))}
      </div>
      <div className="dim-button bucket-button" onClick={() => setIsFarming(!isFarming)}>
        {!isFarming ? 'Start Farming' : 'Stop Farming'}
      </div>
    </InventoryCollapsibleTitle>
  );
}

export default connect<StoreProps>(mapStateToProps)(FarmingView);
