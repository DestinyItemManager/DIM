import { addCompareItem } from 'app/compare/actions';
import { settingSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { showInfuse } from 'app/infuse/infuse';
import { canSyncLockState } from 'app/inventory/SyncTagLock';
import { DimItem } from 'app/inventory/item-types';
import { consolidate, distribute } from 'app/inventory/move-item';
import { sortedStoresSelector, tagSelector } from 'app/inventory/selectors';
import { getStore } from 'app/inventory/stores-helpers';
import ActionButton from 'app/item-actions/ActionButton';
import LockButton from 'app/item-actions/LockButton';
import ItemTagSelector from 'app/item-popup/ItemTagSelector';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { ItemActionsModel } from 'app/item-popup/item-popup-actions';
import { addItemToLoadout } from 'app/loadout-drawer/loadout-events';
import { AppIcon, addIcon, compareIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import { useDispatch, useSelector } from 'react-redux';
import arrowsIn from '../../images/arrows-in.png';
import arrowsOut from '../../images/arrows-out.png';
import d2Infuse from '../../images/d2infuse.png';
import * as styles from './ActionButtons.m.scss';

interface ActionButtonProps {
  item: DimItem;
  label?: boolean;
}

export function CompareActionButton({ item, label }: ActionButtonProps) {
  const dispatch = useDispatch();

  const openCompare = () => {
    hideItemPopup();
    dispatch(addCompareItem(item));
  };

  if (!item.comparable) {
    return null;
  }

  return (
    <ActionButton onClick={openCompare} hotkey="c" hotkeyDescription={t('Compare.ButtonHelp')}>
      <AppIcon icon={compareIcon} />
      {label && <span className={styles.label}>{t('Compare.Button')}</span>}
    </ActionButton>
  );
}

export function LockActionButton({
  item,
  label,
  noHotkey,
}: ActionButtonProps & { noHotkey?: boolean }) {
  const autoLockTagged = useSelector(settingSelector('autoLockTagged'));
  const tag = useSelector(tagSelector(item));

  if (!item.lockable && !item.trackable) {
    return null;
  }

  const disabled = autoLockTagged && tag !== undefined && canSyncLockState(item);

  const type = item.lockable ? 'lock' : 'track';
  // Let's keep these translations around?
  // t('MovePopup.FavoriteUnFavorite.Favorited')
  // t('MovePopup.FavoriteUnFavorite.Unfavorited')
  const title =
    type === 'lock'
      ? item.locked
        ? t('MovePopup.LockUnlock.Locked')
        : t('MovePopup.LockUnlock.Unlocked')
      : item.tracked
        ? t('MovePopup.TrackUntrack.Tracked')
        : t('MovePopup.TrackUntrack.Untracked');

  return (
    <LockButton item={item} type={type} disabled={disabled} noHotkey={noHotkey}>
      {label && <span className={styles.label}>{title}</span>}
    </LockButton>
  );
}

export function TagActionButton({
  item,
  label,
  hideKeys,
}: ActionButtonProps & { hideKeys?: boolean }) {
  if (!item.taggable) {
    return null;
  }

  return (
    <div
      title={t('Tags.TagItem')}
      className={clsx(styles.entry, {
        [styles.tagSelectorLabelHidden]: !label,
      })}
    >
      <ItemTagSelector item={item} hideButtonLabel={!label} hideKeys={hideKeys} />
    </div>
  );
}

export function ConsolidateActionButton({
  item,
  label,
  actionModel,
}: ActionButtonProps & { actionModel: ItemActionsModel }) {
  const stores = useSelector(sortedStoresSelector);
  const owner = getStore(stores, item.owner);
  const dispatch = useThunkDispatch();

  if (!actionModel.canConsolidate) {
    return null;
  }

  const dispatchConsolidate = () => {
    if (owner) {
      dispatch(consolidate(item, owner));
      hideItemPopup();
    }
  };

  return (
    <ActionButton onClick={dispatchConsolidate}>
      <img src={arrowsIn} />
      {label && <span className={styles.label}>{t('MovePopup.Consolidate')}</span>}
    </ActionButton>
  );
}

export function DistributeActionButton({
  item,
  label,
  actionModel,
}: ActionButtonProps & { actionModel: ItemActionsModel }) {
  const dispatch = useThunkDispatch();

  if (!actionModel.canDistribute) {
    return null;
  }

  const dispatchDistribute = () => {
    dispatch(distribute(item));
    hideItemPopup();
  };

  return (
    <ActionButton onClick={dispatchDistribute}>
      <img src={arrowsOut} />
      {label && <span className={styles.label}>{t('MovePopup.DistributeEvenly')}</span>}
    </ActionButton>
  );
}

export function InfuseActionButton({
  item,
  label,
  actionModel,
}: ActionButtonProps & { actionModel: ItemActionsModel }) {
  if (!actionModel.infusable) {
    return null;
  }

  const infuse = () => {
    showInfuse(item);
    hideItemPopup();
  };

  return (
    <ActionButton onClick={infuse} hotkey="i" hotkeyDescription={t('MovePopup.InfuseTitle')}>
      <img src={d2Infuse} />
      {label && <span className={styles.label}>{t('MovePopup.Infuse')}</span>}
    </ActionButton>
  );
}

export function LoadoutActionButton({
  item,
  label,
  actionModel,
}: ActionButtonProps & { actionModel: ItemActionsModel }) {
  if (!actionModel.loadoutable) {
    return null;
  }

  const addToLoadout = () => {
    hideItemPopup();
    addItemToLoadout(item);
  };

  return (
    <ActionButton onClick={addToLoadout} title={t('MovePopup.AddToLoadoutTitle')}>
      <AppIcon icon={addIcon} />
      {label && <span className={styles.label}>{t('MovePopup.AddToLoadout')}</span>}
    </ActionButton>
  );
}
