import styles from 'app/active-mode/Views/LoadoutView.m.scss';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import LoadoutPopup from 'app/loadout/LoadoutPopup';
import React from 'react';

export default function LoadoutView({ store }: { store: DimStore }) {
  return (
    <CollapsibleTitle
      title={t('ActiveMode.Loadouts')}
      sectionId={'active-loadouts'}
      className={styles.collapseTitle}
      defaultCollapsed={true}
    >
      <div className={styles.loadoutView}>
        <LoadoutPopup dimStore={store} hideFarming={true} />
      </div>
    </CollapsibleTitle>
  );
}
