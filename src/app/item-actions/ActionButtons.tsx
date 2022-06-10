import ArmorySheet from 'app/armory/ArmorySheet';
import { addCompareItem } from 'app/compare/actions';
import { t } from 'app/i18next-t';
import { showInfuse } from 'app/infuse/infuse';
import { DimItem } from 'app/inventory/item-types';
import { consolidate, distribute } from 'app/inventory/move-item';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { getStore } from 'app/inventory/stores-helpers';
import ActionButton from 'app/item-actions/ActionButton';
import LockButton from 'app/item-actions/LockButton';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { ItemActionsModel } from 'app/item-popup/item-popup-actions';
import ItemTagSelector from 'app/item-popup/ItemTagSelector';
import { addItemToLoadout } from 'app/loadout-drawer/loadout-events';
import { addIcon, AppIcon, compareIcon, faInfo } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { Portal } from 'app/utils/temp-container';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import arrowsIn from '../../images/arrows-in.png';
import arrowsOut from '../../images/arrows-out.png';
import d2Infuse from '../../images/d2infuse.png';
import styles from './ActionButtons.m.scss';

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
    <ActionButton onClick={openCompare}>
      <AppIcon icon={compareIcon} />
      {label && <span className={styles.label}>{t('Compare.Button')}</span>}
    </ActionButton>
  );
}

export function LockActionButton({ item, label }: ActionButtonProps) {
  if (!item.lockable && !item.trackable) {
    return null;
  }

  const type = item.lockable ? 'lock' : 'track';
  const title =
    type === 'lock'
      ? item.locked
        ? item.bucket.hash === BucketHashes.Finishers
          ? t('MovePopup.FavoriteUnFavorite.Favorited')
          : t('MovePopup.LockUnlock.Locked')
        : item.bucket.hash === BucketHashes.Finishers
        ? t('MovePopup.FavoriteUnFavorite.Unfavorited')
        : t('MovePopup.LockUnlock.Unlocked')
      : item.tracked
      ? t('MovePopup.TrackUntrack.Tracked')
      : t('MovePopup.TrackUntrack.Untracked');

  return (
    <LockButton item={item} type={type}>
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
    <ActionButton onClick={infuse}>
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
    <ActionButton onClick={addToLoadout}>
      <AppIcon icon={addIcon} />
      {label && <span className={styles.label}>{t('MovePopup.AddToLoadout')}</span>}
    </ActionButton>
  );
}

export function ArmoryActionButton({
  item,
  label,
  actionModel,
}: ActionButtonProps & { actionModel: ItemActionsModel }) {
  const [showArmory, setShowArmory] = useState(false);
  if (!actionModel.armory) {
    return null;
  }

  const show = () => {
    setShowArmory(true);
  };

  return (
    <ActionButton onClick={show}>
      <AppIcon icon={faInfo} />
      {label && <span className={styles.label}>{t('Armory.Label')}</span>}

      {showArmory && (
        <Portal>
          <ArmorySheet onClose={() => setShowArmory(false)} item={item} />
        </Portal>
      )}
    </ActionButton>
  );
}
