import React, { useEffect, useState } from 'react';
import { DimItem } from './item-types';
import ConnectedInventoryItem from './ConnectedInventoryItem';
import { AppIcon, refreshIcon } from 'app/shell/icons';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import styles from './MoveNotifications.m.scss';
import { faCheckCircle } from '@fortawesome/free-regular-svg-icons';
import clsx from 'clsx';
import { DimStore } from './store-types';
import { t } from 'app/i18next-t';
import { NotifyInput } from 'app/notifications/notifications';
import { Loadout } from 'app/loadout/loadout.service';
import _ from 'lodash';

/** How long to leave the notification up after it's done. */
const lingerMs = 2000;

/**
 * Generate JSX for a move item notification. This isn't a component.
 */
export function moveItemNotification(
  item: DimItem,
  target: DimStore,
  movePromise: Promise<any>
): NotifyInput {
  return {
    promise: movePromise,
    duration: lingerMs,
    title: item.name,
    icon: <ConnectedInventoryItem item={item} />,
    trailer: <MoveItemNotificationIcon completion={movePromise} />,
    /*
      t('ItemMove.MovingItem_male')
      t('ItemMove.MovingItem_female')
    */
    body: t('ItemMove.MovingItem', {
      name: item.name,
      target: target.name,
      context: target.gender && target.gender.toLowerCase()
    })
  };
}

/**
 * Generate JSX for a loadout apply notification. This isn't a component.
 */
export function loadoutNotification(
  loadout: Loadout,
  store: DimStore,
  loadoutPromise: Promise<any>
): NotifyInput {
  const count = _.sumBy(Object.values(loadout.items), (i) => i.length);

  // TODO: pass in a state updater that can communicate application state

  return {
    promise: loadoutPromise,
    duration: 5000,
    title: t('Loadouts.NotificationTitle', { name: loadout.name }),
    trailer: <MoveItemNotificationIcon completion={loadoutPromise} />,
    body: t('Loadouts.NotificationMessage', {
      // t('Loadouts.NotificationMessage_male')
      // t('Loadouts.NotificationMessage_female')
      // t('Loadouts.NotificationMessage_plural_male')
      // t('Loadouts.NotificationMessage_plural_female')
      count,
      store: store.name,
      context: store.gender && store.gender.toLowerCase()
    })
  };
}

const enum MoveState {
  InProgress,
  Failed,
  Succeeded
}

const moveStateClasses = {
  [MoveState.Failed]: styles.failed,
  [MoveState.Succeeded]: styles.succeeded
};

function MoveItemNotificationIcon({ completion }: { completion: Promise<any> }) {
  const [inProgress, setInProgress] = useState(MoveState.InProgress);
  useEffect(() => {
    let cancel = false;
    completion
      .then(() => !cancel && setInProgress(MoveState.Succeeded))
      .catch(() => !cancel && setInProgress(MoveState.Failed));
    return () => {
      cancel = true;
    };
  }, [completion]);

  const progressIcon =
    inProgress === MoveState.InProgress
      ? refreshIcon
      : inProgress === MoveState.Succeeded
      ? faCheckCircle
      : faExclamationCircle;

  return (
    <div className={clsx(styles.progressIcon, moveStateClasses[inProgress])}>
      <AppIcon icon={progressIcon} spinning={inProgress === MoveState.InProgress} />
    </div>
  );
}
