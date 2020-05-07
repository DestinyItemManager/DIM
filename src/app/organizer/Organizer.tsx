/* eslint-disable react/jsx-key, react/prop-types */
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { RootState } from 'app/store/reducers';
import { D2StoresService } from 'app/inventory/d2-stores';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { useSubscription } from 'app/utils/hooks';
import { queueAction } from 'app/inventory/action-queue';
import { refresh$ } from 'app/shell/refresh';
import { storesSelector } from 'app/inventory/selectors';
import ItemTypeSelector, { ItemCategoryTreeNode } from './ItemTypeSelector';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ItemTable from './ItemTable';
import Spreadsheets from '../settings/Spreadsheets';
import { DimStore } from 'app/inventory/store-types';
import Compare from 'app/compare/Compare';
import styles from './Organizer.m.scss';
import { t } from 'app/i18next-t';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  stores: DimStore[];
  defs: D2ManifestDefinitions;
  isPhonePortrait: boolean;
}

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    defs: state.manifest.d2Manifest!,
    stores: storesSelector(state),
    isPhonePortrait: state.shell.isPhonePortrait
  });
}

type Props = ProvidedProps & StoreProps;

function Organizer({ account, defs, stores, isPhonePortrait }: Props) {
  useEffect(() => {
    if (!stores.length) {
      D2StoresService.getStoresStream(account);
    }
  });

  useSubscription(() =>
    refresh$.subscribe(() => queueAction(() => D2StoresService.reloadStores()))
  );

  const [selection, onSelection] = useState<ItemCategoryTreeNode[]>([]);

  if (isPhonePortrait) {
    return <div>{t('Organizer.NoMobile')}</div>;
  }

  if (!stores.length) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <div className={styles.organizer}>
      <ErrorBoundary name="Organizer">
        <ItemTypeSelector defs={defs} selection={selection} onSelection={onSelection} />
        <ItemTable categories={selection} />
        <Spreadsheets />
        <Compare />
      </ErrorBoundary>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(Organizer);
