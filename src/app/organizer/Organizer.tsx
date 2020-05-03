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
import { storesSelector } from 'app/inventory/selectors';
import ItemTypeSelector, { ItemCategoryTreeNode } from './ItemTypeSelector';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ItemTable from './ItemTable';
import Spreadsheets from '../settings/Spreadsheets';
import { DimStore } from 'app/inventory/store-types';
import Compare from 'app/compare/Compare';
import styles from './Organizer.m.scss';
<<<<<<< HEAD
import { t } from 'app/i18next-t';
=======
import { useHistory } from 'react-router';
>>>>>>> Remove the rest

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  account?: DestinyAccount;
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

  const history = useHistory();
  const [selection, setSelection] = useState<ItemCategoryTreeNode[]>([]);
  const onSelection = (newSelection: ItemCategoryTreeNode[]) => {
    history.push({
      search: `selection=${selection.map((s) => s.id).join(',')}`
    });
    setSelection(newSelection);
  };

  if (isPhonePortrait) {
    return <div>{t('Organizer.NoMobile')}</div>;
  }

  if (!stores.length) {
    return <Loading />;
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
