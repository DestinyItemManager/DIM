import { storesSelector } from 'app/inventory/selectors';
import { RootState } from 'app/store/types';
import { createSelector } from 'reselect';

export const farmingStoreSelector = createSelector(
  storesSelector,
  (state: RootState) => state.farming.storeId,
  (stores, storeId) => stores.find((s) => s.id === storeId),
);

export const farmingInterruptedSelector = (state: RootState) => state.farming.numInterruptions > 0;
