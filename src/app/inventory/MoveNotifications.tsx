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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate JSX for a move item notification. This isn't a component.
 */
export function moveItemNotification(item: DimItem, target: DimStore, movePromise: Promise<any>) {
  return {
    duration: movePromise.then(() => delay(2000)),
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
