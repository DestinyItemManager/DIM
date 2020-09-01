/* eslint-disable react/jsx-key, react/prop-types */
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { RootState } from 'app/store/types';
import ItemTypeSelector, { ItemCategoryTreeNode } from './ItemTypeSelector';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ItemTable from './ItemTable';
import Compare from 'app/compare/Compare';
import styles from './Organizer.m.scss';
import { t } from 'app/i18next-t';
import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { destinyVersionSelector } from 'app/accounts/selectors';

interface StoreProps {
  defs: D2ManifestDefinitions | D1ManifestDefinitions;
  isPhonePortrait: boolean;
}

function mapStateToProps() {
  return (state: RootState): StoreProps => ({
    defs:
      destinyVersionSelector(state) === 2 ? state.manifest.d2Manifest! : state.manifest.d1Manifest!,
    isPhonePortrait: state.shell.isPhonePortrait,
  });
}

type Props = StoreProps;

function Organizer({ defs, isPhonePortrait }: Props) {
  const [selection, onSelection] = useState<ItemCategoryTreeNode[]>([]);

  if (isPhonePortrait) {
    return <div>{t('Organizer.NoMobile')}</div>;
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
