import { t } from 'app/i18next-t';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { NotifyInput } from 'app/notifications/notifications';
import { AppIcon, faCheckCircle, faExclamationCircle, refreshIcon } from 'app/shell/icons';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import ConnectedInventoryItem from './ConnectedInventoryItem';
import { DimItem } from './item-types';
import styles from './MoveNotifications.m.scss';
import { DimStore } from './store-types';

/** How long to leave the notification up after it's done. */
const lingerMs = 2000;

/**
 * Generate JSX for a move item notification. This isn't a component.
 */
export function moveItemNotification(
  item: DimItem,
  target: DimStore,
  movePromise: Promise<unknown>,
  cancel: () => void
): NotifyInput {
  return {
    promise: movePromise,
    duration: 0,
    title: item.name,
    icon: <ConnectedInventoryItem item={item} />,
    trailer: <MoveItemNotificationIcon completion={movePromise} />,
    body: t('ItemMove.MovingItem', {
      name: item.name,
      target: target.name,
      context: target.genderName,
    }),
    onCancel: cancel,
  };
}

/**
 * Generate JSX for a loadout apply notification. This isn't a component.
 */
export function loadoutNotification(
  loadout: Loadout,
  numApplicableItems: number,
  numMods: number,
  store: DimStore,
  loadoutPromise: Promise<unknown>,
  cancel: () => void
): NotifyInput {
  // TODO: pass in a state updater that can communicate application state
  // TODO: body! show all items, check 'em off

  return {
    promise: loadoutPromise,
    duration: lingerMs,
    title: t('Loadouts.NotificationTitle', { name: loadout.name }),
    trailer: <MoveItemNotificationIcon completion={loadoutPromise} />,
    body:
      t('Loadouts.NotificationMessage', {
        count: numApplicableItems,
        store: store.name,
        context: store.genderName,
      }) +
      (numMods > 0
        ? '\n\n' +
          t('Loadouts.NotificationMessageMods', {
            count: numApplicableItems,
          })
        : ''),
    onCancel: cancel,
  };
}

/**
 * Generate JSX for a pull from postmaster notification. This isn't a component.
 */
export function postmasterNotification(
  count: number,
  store: DimStore,
  promise: Promise<unknown>,
  cancel: () => void
): NotifyInput {
  // TODO: pass in a state updater that can communicate application state

  return {
    promise,
    duration: lingerMs,
    title: t('Loadouts.PullFromPostmasterPopupTitle'),
    trailer: <MoveItemNotificationIcon completion={promise} />,
    body: t('Loadouts.PullFromPostmasterNotification', {
      count,
      store: store.name,
      context: store.genderName,
    }),
    onCancel: cancel,
  };
}

const enum MoveState {
  InProgress,
  Failed,
  Succeeded,
}

const moveStateClasses = {
  [MoveState.Failed]: styles.failed,
  [MoveState.Succeeded]: styles.succeeded,
};

function MoveItemNotificationIcon({ completion }: { completion: Promise<unknown> }) {
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
