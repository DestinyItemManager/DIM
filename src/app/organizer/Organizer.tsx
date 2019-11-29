/* eslint-disable react/jsx-key, react/prop-types */
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { DimItem } from 'app/inventory/item-types';
import { RootState } from 'app/store/reducers';
import { D2StoresService } from 'app/inventory/d2-stores';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { useSubscription } from 'app/utils/hooks';
import { queueAction } from 'app/inventory/action-queue';
import { refresh$ } from 'app/shell/refresh';
import { Loading } from 'app/dim-ui/Loading';
import { createSelector } from 'reselect';
import { storesSelector } from 'app/inventory/reducer';
import { searchFilterSelector } from 'app/search/search-filters';
import ItemTypeSelector, { SelectionTreeNode } from './ItemTypeSelector';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ItemTable from './ItemTable';
import Spreadsheets from '../settings/Spreadsheets';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  items: DimItem[];
  defs: D2ManifestDefinitions;
}

function mapStateToProps() {
  const allItemsSelector = createSelector(storesSelector, (stores) =>
    stores.flatMap((s) => s.items).filter((i) => i.comparable && i.primStat)
  );
  // TODO: make the table a subcomponent so it can take the subtype as an argument?
  return (state: RootState): StoreProps => {
    const searchFilter = searchFilterSelector(state);
    return {
      items: allItemsSelector(state).filter(searchFilter),
      defs: state.manifest.d2Manifest!
    };
  };
}

type Props = ProvidedProps & StoreProps;

function Organizer({ account, items, defs }: Props) {
  useEffect(() => {
    if (!items.length) {
      D2StoresService.getStoresStream(account);
    }
  });

  useSubscription(() =>
    refresh$.subscribe(() => queueAction(() => D2StoresService.reloadStores()))
  );

  const [selection, setSelection] = useState<SelectionTreeNode[]>([]);

  if (!items.length) {
    return <Loading />;
  }

  // TODO: separate table view component from the rest
  // TODO: sorting
  // TODO: choose columns
  // TODO: choose item types (iOS style tabs?)
  // TODO: search
  // TODO: selection/bulk actions
  // TODO: item popup

  // Render the UI for your table
  return (
    <div>
      <ErrorBoundary name="Organizer">
        <ItemTypeSelector defs={defs} selection={selection} onSelection={setSelection} />
        <ItemTable items={items} selection={selection} />
        <Spreadsheets />
      </ErrorBoundary>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(Organizer);
