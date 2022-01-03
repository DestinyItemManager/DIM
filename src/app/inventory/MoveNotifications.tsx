import { t, tl } from 'app/i18next-t';
import {
  LoadoutApplyPhase,
  LoadoutApplyState,
  LoadoutItemState,
  LoadoutModState,
  LoadoutSocketOverrideState,
} from 'app/loadout-drawer/loadout-apply-state';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { NotificationError, NotifyInput } from 'app/notifications/notifications';
import {
  AppIcon,
  faCheckCircle,
  faExclamationCircle,
  faExclamationTriangle,
  refreshIcon,
} from 'app/shell/icons';
import { DimError } from 'app/utils/dim-error';
import { Observable } from 'app/utils/observable';
import clsx from 'clsx';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { useSubscription } from 'use-subscription';
import ConnectedInventoryItem from './ConnectedInventoryItem';
import { DimItem } from './item-types';
import ItemIcon, { DefItemIcon } from './ItemIcon';
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
    duration: lingerMs,
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
  stateObservable: Observable<LoadoutApplyState>,
  loadoutPromise: Promise<unknown>,
  cancel: () => void
): NotifyInput {
  return {
    promise: loadoutPromise.catch((e) => {
      throw new NotificationError(e.message, {
        body: <ApplyLoadoutProgressBody stateObservable={stateObservable} />,
      });
    }),
    duration: 5_000,
    title: t('Loadouts.NotificationTitle', { name: loadout.name }),
    body: <ApplyLoadoutProgressBody stateObservable={stateObservable} />,
    onCancel: cancel,
  };
}

const messageByPhase: { [phase in LoadoutApplyPhase]: string } = {
  [LoadoutApplyPhase.NotStarted]: tl('Loadouts.NotStarted'),
  [LoadoutApplyPhase.Deequip]: tl('Loadouts.Deequip'),
  [LoadoutApplyPhase.MoveItems]: tl('Loadouts.MoveItems'),
  [LoadoutApplyPhase.EquipItems]: tl('Loadouts.EquipItems'),
  [LoadoutApplyPhase.SocketOverrides]: tl('Loadouts.SocketOverrides'),
  [LoadoutApplyPhase.ApplyMods]: tl('Loadouts.ApplyMods'),
  [LoadoutApplyPhase.ClearSpace]: tl('Loadouts.ClearingSpace'),
  [LoadoutApplyPhase.Succeeded]: tl('Loadouts.Succeeded'),
  [LoadoutApplyPhase.Failed]: tl('Loadouts.Failed'),
};

function ApplyLoadoutProgressBody({
  stateObservable,
}: {
  stateObservable: Observable<LoadoutApplyState>;
}) {
  // TODO: throttle subscription?
  const { phase, equipNotPossible, itemStates, socketOverrideStates, modStates } =
    useSubscription(stateObservable);
  const defs = useD2Definitions()!;

  const progressIcon =
    phase === LoadoutApplyPhase.Succeeded
      ? faCheckCircle
      : phase === LoadoutApplyPhase.Failed
      ? faExclamationCircle
      : refreshIcon;

  const itemStatesList = Object.values(itemStates);
  // TODO: when we have per-item socket overrides this'll probably need to be more subtle
  const socketOverrideStatesList = Object.values(socketOverrideStates);

  const groupedItemErrors = _.groupBy(
    itemStatesList.filter(({ error }) => error),
    ({ error }) =>
      (error instanceof DimError ? error.bungieErrorCode() ?? error.cause?.message : undefined) ??
      error?.message
  );

  const groupedModErrors = _.groupBy(
    modStates.filter(({ error }) => error),
    ({ error }) =>
      (error instanceof DimError ? error.bungieErrorCode() ?? error.cause?.message : undefined) ??
      error?.message
  );

  return (
    <>
      <div className={clsx(styles.loadoutDetails)}>
        <AppIcon icon={progressIcon} spinning={progressIcon === refreshIcon} />
        {t(messageByPhase[phase])}
      </div>
      {equipNotPossible && (
        <div className={styles.warning}>
          <AppIcon className={styles.warningIcon} icon={faExclamationTriangle} />
          {t('BungieService.DestinyCannotPerformActionAtThisLocation')}
        </div>
      )}
      {itemStatesList.length > 0 && (
        <div className={styles.iconList}>
          {itemStatesList.map(({ item, state }) => (
            <div
              className={clsx('item', {
                [styles.loadoutItemPending]:
                  state === LoadoutItemState.Pending ||
                  state === LoadoutItemState.DequippedPendingMove ||
                  state === LoadoutItemState.MovedPendingEquip,
                [styles.loadoutItemFailed]:
                  state === LoadoutItemState.FailedDequip ||
                  state === LoadoutItemState.FailedEquip ||
                  state === LoadoutItemState.FailedMove,
              })}
              key={item.index}
            >
              <ItemIcon item={item} />
            </div>
          ))}
        </div>
      )}

      {!_.isEmpty(groupedItemErrors) && (
        <div className={styles.errorList}>
          {Object.values(groupedItemErrors).map((errorStates) => (
            <div key={errorStates[0].item.index}>
              <b>{t('Loadouts.ItemErrorSummary', { count: errorStates.length })}</b>{' '}
              {errorStates[0].error instanceof DimError && errorStates[0].error.cause
                ? errorStates[0].error.cause.message
                : errorStates[0].error!.message}
            </div>
          ))}
        </div>
      )}

      {socketOverrideStatesList.length > 0 && (
        <div className={styles.iconList}>
          {socketOverrideStatesList.map(({ item, results }) => (
            <div key={item.index} className={styles.iconList}>
              {Object.entries(results).map(([socketIndex, { plugHash, state }]) => (
                <div
                  key={socketIndex}
                  className={clsx('item', {
                    [styles.loadoutItemPending]: state === LoadoutSocketOverrideState.Pending,
                    [styles.loadoutItemFailed]: state === LoadoutSocketOverrideState.Failed,
                  })}
                >
                  <DefItemIcon itemDef={defs.InventoryItem.get(plugHash)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {modStates.length > 0 && (
        <div className={styles.iconList}>
          {modStates.map(({ modHash, state }, i) => (
            <div
              key={i}
              className={clsx('item', {
                [styles.loadoutItemPending]: state === LoadoutModState.Pending,
                [styles.loadoutItemFailed]:
                  state === LoadoutModState.Unassigned || state === LoadoutModState.Failed,
              })}
            >
              <DefItemIcon itemDef={defs.InventoryItem.get(modHash)} />
            </div>
          ))}
        </div>
      )}

      {!_.isEmpty(groupedModErrors) && (
        <div className={styles.errorList}>
          {Object.values(groupedModErrors).map((errorStates) => (
            <div key={errorStates[0].modHash}>
              <b>{t('Loadouts.ModErrorSummary', { count: errorStates.length })}</b>{' '}
              {errorStates[0].error instanceof DimError && errorStates[0].error.cause
                ? errorStates[0].error.cause.message
                : errorStates[0].error!.message}
            </div>
          ))}
        </div>
      )}
    </>
  );
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
