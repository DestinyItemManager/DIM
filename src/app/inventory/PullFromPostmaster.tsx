import { t } from 'app/i18next-t';
import { ThunkDispatchProp } from 'app/store/types';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { pullablePostmasterItems, pullFromPostmaster } from '../loadout/postmaster';
import { AppIcon, refreshIcon, sendIcon } from '../shell/icons';
import { queueAction } from './action-queue';
import { D2Store } from './store-types';

export function PullFromPostmaster({ store }: { store: D2Store }) {
  const [working, setWorking] = useState(false);
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();

  const numPullablePostmasterItems = pullablePostmasterItems(store).length;
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
