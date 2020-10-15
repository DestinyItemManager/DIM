import { StoreIcons } from 'app/character-tile/StoreIcons';
import { CompareService } from 'app/compare/compare.service';
import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { amountOfItem, getStore } from 'app/inventory/stores-helpers';
import { addItemToLoadout } from 'app/loadout/LoadoutDrawer';
import { setSetting } from 'app/settings/actions';
import { addIcon, AppIcon, closeIcon, compareIcon, faExpandAlt } from 'app/shell/icons';
import { ThunkDispatchProp } from 'app/store/types';
import { itemCanBeEquippedBy, itemCanBeInLoadout } from 'app/utils/item-utils';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import arrowsIn from '../../images/arrows-in.png';
import arrowsOut from '../../images/arrows-out.png';
import d2Infuse from '../../images/d2infuse.png';
import { showInfuse } from '../infuse/infuse';
import { DimItem } from '../inventory/item-types';
import { consolidate, distribute, moveItemTo } from '../inventory/move-item';
import { sortedStoresSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import styles from './DesktopItemActions.m.scss';
import { hideItemPopup } from './item-popup';
import ItemMoveAmount from './ItemMoveAmount';
import ItemTagSelector from './ItemTagSelector';
import LockButton from './LockButton';

export default function DesktopItemActions({ item }: { item: DimItem }) {
  const stores = useSelector(sortedStoresSelector);
  const sidecarCollapsed = useSelector((state) => settingsSelector(state).sidecarCollapsed)
  const [amount, setAmount] = useState(item.amount);
  const itemOwner = getStore(stores, item.owner);
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();

  // If the item can't be transferred (or is unique) don't show the move amount slider
  const maximum = useMemo(
    () =>
      !itemOwner || item.maxStackSize <= 1 || item.notransfer || item.uniqueStack
        ? 1
        : amountOfItem(itemOwner, item),
    [itemOwner, item]
  );

  const onMoveItemTo = (store: DimStore, equip = false) => {
    dispatch(moveItemTo(item, store, equip, amount));
    hideItemPopup();
  };

  /*
   * Open up the dialog for infusion by passing
   * the selected item
   */
  const infuse = () => {
    showInfuse(item);
    hideItemPopup();
  };

  const onConsolidate = () => {
    if (itemOwner) {
      dispatch(consolidate(item, itemOwner));
      hideItemPopup();
    }
  };

  const onDistribute = () => {
    dispatch(distribute(item));
    hideItemPopup();
  };

  const onToggleSidecar = () => {
    dispatch(setSetting('sidecarCollapsed', !sidecarCollapsed));
  };

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const reposition = () => {
      if (containerRef.current) {
        let parent = containerRef.current.parentElement;
        while (parent && !parent.classList.contains('item-popup')) {
          parent = parent.parentElement;
        }
        const arrow = parent?.querySelector('.arrow') as HTMLDivElement;
        if (!arrow || !parent) {
          return;
        }
        const arrowRect = arrow.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const containerHeight = containerRef.current.clientHeight;
        const offset = arrowRect.top - parentRect.top + 2.5;

        const top = Math.min(
          Math.max(0, offset - containerHeight / 2),
          parent.clientHeight - containerHeight
        );

        containerRef.current.style.transform = `translateY(${Math.round(top)}px)`;
      }
    };

    reposition();
    setTimeout(reposition, 10);
  });

  const onAmountChanged = setAmount;

  if (!itemOwner) {
    return null;
  }

  const canConsolidate =
    !item.notransfer &&
    item.location.hasTransferDestination &&
    item.maxStackSize > 1 &&
    stores.some((s) => s !== itemOwner && amountOfItem(s, item) > 0);
  const canDistribute = item.destinyVersion === 1 && !item.notransfer && item.maxStackSize > 1;

  const openCompare = () => {
    hideItemPopup();
    CompareService.addItemsToCompare([item], true);
  };

  const addToLoadout = (e) => {
    hideItemPopup();
    addItemToLoadout(item, e);
  };

  return (
    <>
      <div
        className={clsx(styles.interaction, { [styles.collapsed]: sidecarCollapsed })}
        ref={containerRef}
      >
        <div
          className={styles.collapseButton}
          onClick={onToggleSidecar}
          role="button"
          tabIndex={-1}
        >
          <AppIcon icon={sidecarCollapsed ? faExpandAlt : closeIcon} />
        </div>
        {$featureFlags.moveAmounts && item.destinyVersion === 1 && maximum > 1 && (
          <ItemMoveAmount
            amount={amount}
            maximum={maximum}
            maxStackSize={item.maxStackSize}
            onAmountChanged={onAmountChanged}
          />
        )}
        {item.taggable && (
          <div className={styles.itemTagSelector}>
            <ItemTagSelector item={item} hideButtonLabel={sidecarCollapsed} />
          </div>
        )}
        {(item.lockable || item.trackable) && (
          <LockButton
            className={styles.actionButton}
            item={item}
            type={item.lockable ? 'lock' : 'track'}
          >
            {!sidecarCollapsed && lockButtonTitle(item, item.lockable ? 'lock' : 'track')}
          </LockButton>
        )}
        {stores.map((store) => (
          <React.Fragment key={store.id}>
            {store.isVault && canShowVault(store, itemOwner, item) && (
              <div
                className={styles.actionButton}
                onClick={() => onMoveItemTo(store)}
                role="button"
                tabIndex={-1}
              >
                <StoreIcons store={store} />
                {!sidecarCollapsed && t('MovePopup.Vault')}
              </div>
            )}
            {!sidecarCollapsed && canShowStore(store, itemOwner, item) && (
              <div
                className={clsx(styles.actionButton, styles.move, {
                  [styles.disabled]: !storeButtonEnabled(store, itemOwner, item),
                })}
                onClick={() => onMoveItemTo(store)}
                role="button"
                tabIndex={-1}
              >
                <StoreIcons store={store} />
                {t('MovePopup.Store')}
              </div>
            )}
            {!sidecarCollapsed && itemCanBeEquippedBy(item, store) && (
              <div
                className={clsx(styles.actionButton, styles.equip, {
                  [styles.disabled]: item.owner === store.id && item.equipped,
                })}
                onClick={() => onMoveItemTo(store, true)}
                role="button"
                tabIndex={-1}
              >
                <StoreIcons store={store} />
                {t('MovePopup.Equip')}
              </div>
            )}
          </React.Fragment>
        ))}
        {item.comparable && (
          <div className={styles.actionButton} onClick={openCompare} role="button" tabIndex={-1}>
            <AppIcon icon={compareIcon} />
            {!sidecarCollapsed && t('Compare.Button')}
          </div>
        )}
        {canConsolidate && (
          <div className={styles.actionButton} onClick={onConsolidate} role="button" tabIndex={-1}>
            <img src={arrowsIn} height="32" width="32" />
            {!sidecarCollapsed && t('MovePopup.Consolidate')}
          </div>
        )}
        {canDistribute && (
          <div className={styles.actionButton} onClick={onDistribute} role="button" tabIndex={-1}>
            <img src={arrowsOut} height="32" width="32" />
            {!sidecarCollapsed && t('MovePopup.DistributeEvenly')}
          </div>
        )}
        {itemCanBeInLoadout(item) && (
          <div className={styles.actionButton} onClick={addToLoadout} role="button" tabIndex={-1}>
            <AppIcon icon={addIcon} />
            {!sidecarCollapsed && t('MovePopup.AddToLoadout')}
          </div>
        )}
        {item.infusionFuel && (
          <div className={styles.actionButton} onClick={infuse} role="button" tabIndex={-1}>
            <img src={d2Infuse} height="32" width="32" />
            {!sidecarCollapsed && t('MovePopup.Infuse')}
          </div>
        )}
      </div>
    </>
  );
}

export function lockButtonTitle(item: DimItem, type: 'lock' | 'track') {
  return type === 'lock'
    ? item.locked
      ? t('MovePopup.LockUnlock.Locked')
      : t('MovePopup.LockUnlock.Unlocked')
    : item.tracked
    ? t('MovePopup.TrackUntrack.Tracked')
    : t('MovePopup.TrackUntrack.Untracked');
}

function canShowVault(buttonStore: DimStore, itemOwnerStore: DimStore, item: DimItem): boolean {
  const store = itemOwnerStore;

  // If my store is the vault, don't show a vault button.
  // Can't vault a vaulted item.
  if (!store || store.isVault) {
    return false;
  }

  // If my buttonStore is not the vault, then show a vault button.
  if (!buttonStore.isVault) {
    return false;
  }

  // Can't move this item away from the current itemStore.
  if (item.notransfer) {
    return false;
  }

  if (item.location.inPostmaster && !item.canPullFromPostmaster) {
    return false;
  }

  return true;
}

function storeButtonEnabled(
  buttonStore: DimStore,
  itemOwnerStore: DimStore,
  item: DimItem
): boolean {
  const store = itemOwnerStore;

  if (item.location.inPostmaster && item.location.type !== 'Engrams') {
    return item.canPullFromPostmaster;
  } else if (item.notransfer) {
    // Can store an equiped item in same itemStore
    if (item.equipped && store.id === buttonStore.id) {
      return true;
    }
  } else if (store.id !== buttonStore.id || item.equipped) {
    // Only show one store for account wide items
    if (item.bucket?.accountWide && !buttonStore.current) {
      return false;
    } else {
      return true;
    }
  }

  return false;
}

function canShowStore(buttonStore: DimStore, itemOwnerStore: DimStore, item: DimItem): boolean {
  const store = itemOwnerStore;

  // Can't store into a vault
  if (buttonStore.isVault || !store) {
    return false;
  }

  // Don't show "Store" for finishers, seasonal artifacts, or clan banners
  if (
    item.location.capacity === 1 ||
    item.location.hash === BucketHashes.SeasonalArtifact ||
    item.location.hash === BucketHashes.Finishers
  ) {
    return false;
  }

  // Can pull items from the postmaster.
  if (item.location.inPostmaster && item.location.type !== 'Engrams') {
    return item.canPullFromPostmaster;
  } else if (item.notransfer) {
    // Can store an equiped item in same itemStore
    if (item.equipped && store.id === buttonStore.id) {
      return true;
    }
  } else {
    // Only show one store for account wide items
    if (item.bucket?.accountWide && !buttonStore.current) {
      return false;
    } else {
      return true;
    }
  }

  return false;
}
