/* eslint-disable react/jsx-key, react/prop-types */
import React, { useState } from 'react';
import ItemTypeSelector, { ItemCategoryTreeNode } from './ItemTypeSelector';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ItemTable from './ItemTable';
import Compare from 'app/compare/Compare';
import styles from './Organizer.m.scss';
import { t } from 'app/i18next-t';
import withStoresLoader from 'app/utils/withStoresLoader';
import { StoresLoadedProps } from 'app/utils/withStoresLoader';

type Props = StoresLoadedProps;

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

export default withStoresLoader(Organizer);
