import { settingSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { pullablePostmasterItems, pullFromPostmaster } from '../loadout-drawer/postmaster';
import { AppIcon, refreshIcon, sendIcon } from '../shell/icons';
import { queueAction } from '../utils/action-queue';
import * as styles from './PullFromPostmaster.m.scss';
import { storesSelector } from './selectors';
import { DimStore } from './store-types';

export function PullFromPostmaster({ store }: { store: DimStore }) {
  const [working, setWorking] = useState(false);
  const dispatch = useThunkDispatch();
  const hidePullFromPostmaster = useSelector(settingSelector('hidePullFromPostmaster'));
  const numPullablePostmasterItems = useSelector(
    (state: RootState) => pullablePostmasterItems(store, storesSelector(state)).length,
  );
  if (hidePullFromPostmaster || numPullablePostmasterItems === 0) {
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
    <button type="button" className={styles.button} onClick={onClick}>
      <AppIcon spinning={working} icon={working ? refreshIcon : sendIcon} />
      <span className={styles.badge}>{numPullablePostmasterItems}</span>
      <span>{t('Loadouts.PullFromPostmaster')}</span>
    </button>
  );
}
