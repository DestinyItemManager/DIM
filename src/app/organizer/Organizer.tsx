/* eslint-disable react/jsx-key, react/prop-types */
import { DestinyAccount } from 'app/accounts/destiny-account';
import { destinyVersionSelector } from 'app/accounts/selectors';
import Compare from 'app/compare/Compare';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { storesSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { useLoadStores } from 'app/inventory/store/hooks';
import { RootState } from 'app/store/types';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import ItemTable from './ItemTable';
import ItemTypeSelector, { ItemCategoryTreeNode } from './ItemTypeSelector';
import styles from './Organizer.m.scss';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  stores: DimStore[];
  defs: D2ManifestDefinitions | D1ManifestDefinitions;
  isPhonePortrait: boolean;
}

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    defs:
      destinyVersionSelector(state) === 2 ? state.manifest.d2Manifest! : state.manifest.d1Manifest!,
    stores: storesSelector(state),
    isPhonePortrait: state.shell.isPhonePortrait,
  });
}

type Props = ProvidedProps & StoreProps;

function Organizer({ account, defs, stores, isPhonePortrait }: Props) {
  useLoadStores(account, stores.length > 0);

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
        <Compare />
      </ErrorBoundary>
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(Organizer);
