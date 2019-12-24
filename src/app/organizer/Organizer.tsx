/* eslint-disable react/jsx-key, react/prop-types */
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { RootState } from 'app/store/reducers';
import { D2StoresService } from 'app/inventory/d2-stores';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { useSubscription } from 'app/utils/hooks';
import { queueAction } from 'app/inventory/action-queue';
import { refresh$ } from 'app/shell/refresh';
import { Loading } from 'app/dim-ui/Loading';
import { storesSelector } from 'app/inventory/reducer';
import ItemTypeSelector, { SelectionTreeNode } from './ItemTypeSelector';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ItemTable from './ItemTable';
import Spreadsheets from '../settings/Spreadsheets';
import { DimItemInfo } from 'app/inventory/dim-item-info';
import { DimStore } from 'app/inventory/store-types';
import styles from './Organizer.m.scss';
import Compare from 'app/compare/Compare';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  account?: DestinyAccount;
  stores: DimStore[];
  defs: D2ManifestDefinitions;
  itemInfos: { [key: string]: DimItemInfo };
  isPhonePortrait: boolean;
}

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    defs: state.manifest.d2Manifest!,
    stores: storesSelector(state),
    itemInfos: state.inventory.itemInfos,
    isPhonePortrait: state.shell.isPhonePortrait
  });
}

type Props = ProvidedProps & StoreProps;

function Organizer({ account, defs, itemInfos, stores, isPhonePortrait }: Props) {
  useEffect(() => {
    if (!stores.length) {
      D2StoresService.getStoresStream(account);
    }
  });

  useSubscription(() =>
    refresh$.subscribe(() => queueAction(() => D2StoresService.reloadStores()))
  );

  const [selection, setSelection] = useState<SelectionTreeNode[]>([]);

  if (isPhonePortrait) {
    return <div className={styles.page}>This view isn't great on mobile.</div>;
  }

  if (!stores.length) {
    return <Loading />;
  }

  return (
    <div className={styles.page}>
      <ErrorBoundary name="Organizer">
        <ItemTypeSelector defs={defs} selection={selection} onSelection={setSelection} />
        <ItemTable selection={selection} />
        <Spreadsheets stores={stores} itemInfos={itemInfos} />
        <Compare />
      </ErrorBoundary>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(Organizer);
