import { t } from 'app/i18next-t';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { storesSelector } from '../inventory-stores/selectors';
import { DimStore } from '../inventory-stores/store-types';
import { pullablePostmasterItems, pullFromPostmaster } from '../loadout-drawer/postmaster';
import { AppIcon, refreshIcon, sendIcon } from '../shell/icons';
import { queueAction } from '../utils/action-queue';
import styles from './PullFromPostmaster.m.scss';

export function PullFromPostmaster({ store }: { store: DimStore }) {
  const [working, setWorking] = useState(false);
  const dispatch = useThunkDispatch();
  const numPullablePostmasterItems = useSelector(
    (state: RootState) => pullablePostmasterItems(store, storesSelector(state)).length
  );
  if (numPullablePostmasterItems === 0) {
    return null;
  }

  const onClick = () => {
    queueAction(async () => {
      setWorking(true);
      try {
        await dispatch(pullFromPostmaster(store));
      } finally {
        setWorking(false);
      }
    });
  };

  return (
    <div className={styles.button} onClick={onClick}>
      <AppIcon spinning={working} icon={working ? refreshIcon : sendIcon} />
      <span className={styles.badge}>{numPullablePostmasterItems}</span>
      <span>{t('Loadouts.PullFromPostmaster')}</span>
    </div>
  );
}
