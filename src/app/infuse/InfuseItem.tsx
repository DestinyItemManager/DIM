import * as React from 'react';
import store from '../store/store';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { DimItem } from '../inventory/item-types';
import { Provider } from 'react-redux';

export default function InfuseItem({ itemData }: { itemData: DimItem }) {
  return (
    <Provider store={store}>
      <ConnectedInventoryItem item={itemData} />
    </Provider>
  );
}
