import { t } from 'app/i18next-t';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { pullablePostmasterItems, pullFromPostmaster } from '../loadout/postmaster';
import { AppIcon, refreshIcon, sendIcon } from '../shell/icons';
import { queueAction } from '../utils/action-queue';
import { storesSelector } from './selectors';
import { DimStore } from './store-types';

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
    <div className="dim-button bucket-button" onClick={onClick}>
      <AppIcon spinning={working} icon={working ? refreshIcon : sendIcon} />{' '}
      <span className="badge">{numPullablePostmasterItems}</span> {t('Loadouts.PullFromPostmaster')}
    </div>
  );
}
