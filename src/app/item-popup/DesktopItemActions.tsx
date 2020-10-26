import { StoreIcons } from 'app/character-tile/StoreIcons';
import { CompareService } from 'app/compare/compare.service';
import { settingsSelector } from 'app/dim-api/selectors';
import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { amountOfItem, getCurrentStore, getStore, getVault } from 'app/inventory/stores-helpers';
import { addItemToLoadout } from 'app/loadout/LoadoutDrawer';
import { setSetting } from 'app/settings/actions';
import { addIcon, AppIcon, compareIcon, maximizeIcon, minimizeIcon } from 'app/shell/icons';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { itemCanBeEquippedBy, itemCanBeInLoadout } from 'app/utils/item-utils';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import arrowsIn from '../../images/arrows-in.png';
import arrowsOut from '../../images/arrows-out.png';
import d2Infuse from '../../images/d2infuse.png';
import { showInfuse } from '../infuse/infuse';
import { DimItem } from '../inventory/item-types';
import { consolidate, distribute, moveItemTo } from '../inventory/move-item';
import { DimStore } from '../inventory/store-types';
import styles from './DesktopItemActions.m.scss';
import { hideItemPopup } from './item-popup';
import ItemMoveAmount from './ItemMoveAmount';
import ItemTagSelector from './ItemTagSelector';
import LockButton from './LockButton';

const sidecarCollapsedSelector = (state: RootState) => settingsSelector(state).sidecarCollapsed;

export default function DesktopItemActions({ item }: { item: DimItem }) {
  const stores = useSelector(sortedStoresSelector);
  const vault = getVault(stores);
  const sidecarCollapsed = useSelector(sidecarCollapsedSelector);
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

  useHotkey('k', t('MovePopup.ToggleSidecar'), onToggleSidecar);
  useHotkey('p', t('Hotkey.Pull'), () => {
    const currentChar = getCurrentStore(stores)!;
    onMoveItemTo(currentChar);
  });
  useHotkey('v', t('Hotkey.Vault'), () => {
    const vault = getVault(stores)!;
    onMoveItemTo(vault);
  });

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

        const top = _.clamp(offset - containerHeight / 2, 0, parent.clientHeight - containerHeight);

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
    CompareService.addItemsToCompare([item]);
  };

  const addToLoadout = (e) => {
    hideItemPopup();
    addItemToLoadout(item, e);
  };

  const showCollapse =
    item.taggable ||
    item.lockable ||
    item.trackable ||
    !item.notransfer ||
    item.comparable ||
    canConsolidate ||
    canDistribute ||
    item.equipment ||
    item.infusionFuel;

  const canEquip = stores.filter((store) => itemCanBeEquippedBy(item, store));
  const canStore = stores.filter((store) => canShowStore(store, itemOwner, item));

  return (
    <>
      <div
        className={clsx(styles.interaction, { [styles.collapsed]: sidecarCollapsed })}
        ref={containerRef}
      >
        {showCollapse && (
          <div
            className={styles.collapseButton}
            onClick={onToggleSidecar}
            role="button"
            title={t('MovePopup.ToggleSidecar') + ' [K]'}
            tabIndex={-1}
          >
            <AppIcon icon={sidecarCollapsed ? maximizeIcon : minimizeIcon} />
          </div>
        )}
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
            <span className={clsx({ [styles.hideLabel]: sidecarCollapsed })}>
              {lockButtonTitle(item, item.lockable ? 'lock' : 'track')}
            </span>
          </LockButton>
        )}
        {item.comparable && (
          <ActionButton onClick={openCompare}>
            <AppIcon icon={compareIcon} />
            <span className={clsx({ [styles.hideLabel]: sidecarCollapsed })}>
              {t('Compare.Button')}
            </span>
          </ActionButton>
        )}
        {canConsolidate && (
          <ActionButton onClick={onConsolidate}>
            <img src={arrowsIn} height="32" width="32" />
            <span className={clsx({ [styles.hideLabel]: sidecarCollapsed })}>
              {t('MovePopup.Consolidate')}
            </span>
          </ActionButton>
        )}
        {canDistribute && (
          <ActionButton onClick={onDistribute}>
            <img src={arrowsOut} height="32" width="32" />
            <span className={clsx({ [styles.hideLabel]: sidecarCollapsed })}>
              {t('MovePopup.DistributeEvenly')}
            </span>
          </ActionButton>
        )}
        {itemCanBeInLoadout(item) && (
          <ActionButton onClick={addToLoadout}>
            <AppIcon icon={addIcon} />
            <span className={clsx({ [styles.hideLabel]: sidecarCollapsed })}>
              {t('MovePopup.AddToLoadout')}
            </span>
          </ActionButton>
        )}
        {item.infusionFuel && (
          <ActionButton onClick={infuse}>
            <img src={d2Infuse} height="32" width="32" />
            <span className={clsx({ [styles.hideLabel]: sidecarCollapsed })}>
              {t('MovePopup.Infuse')}
            </span>
          </ActionButton>
        )}
        {!sidecarCollapsed && vault && canShowVault(vault, itemOwner, item) && (
          <ActionButton onClick={() => onMoveItemTo(vault)} title={t('MovePopup.Vault') + ' [V]'}>
            <StoreIcons store={vault} /> {t('MovePopup.Vault')}
          </ActionButton>
        )}
        {!sidecarCollapsed && (
          <MoveLocations
            label={t('MovePopup.Equip')}
            stores={stores}
            appicableStores={canEquip}
            equip={true}
            showLocation={(store) => itemCanBeEquippedBy(item, store)}
            isDisabled={(store) => item.owner === store.id && item.equipped}
            onMoveItemTo={onMoveItemTo}
          />
        )}
        {!sidecarCollapsed && (
          <MoveLocations
            label={t('MovePopup.Store')}
            shortcutKey=" [P]"
            stores={stores}
            appicableStores={canStore}
            showLocation={(store) => canShowStore(store, itemOwner, item)}
            isDisabled={(store) => !storeButtonEnabled(store, itemOwner, item)}
            onMoveItemTo={onMoveItemTo}
          />
        )}
      </div>
    </>
  );
}

function ActionButton({
  disabled,
  title,
  children,
  onClick,
}: {
  title?: string;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={clsx(styles.actionButton, { [styles.disabled]: disabled })}
      onClick={onClick}
      title={title}
      role="button"
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

function MoveLocations({
  label,
  shortcutKey,
  stores,
  appicableStores,
  equip,
  isDisabled,
  showLocation,
  onMoveItemTo,
}: {
  label: string;
  shortcutKey?: string;
  stores: DimStore[];
  appicableStores: DimStore[];
  equip?: boolean;
  isDisabled: (store: DimStore) => boolean;
  showLocation: (store: DimStore) => boolean;
  onMoveItemTo: (store: DimStore, equip?: boolean) => void;
}) {
  if (!appicableStores.length) {
    return null;
  }

  return (
    <div className={styles.moveLocations}>
      {label}
      <div className={styles.moveLocationIcons}>
        {stores.map((store) => (
          <React.Fragment key={store.id}>
            {showLocation(store) && (
              <div
                className={clsx({
                  [styles.equip]: equip,
                  [styles.move]: !equip,
                  [styles.disabled]: isDisabled(store),
                })}
                title={`${label}${shortcutKey ? ' ' + shortcutKey : ''}`}
                onClick={() => onMoveItemTo(store, equip)}
                role="button"
                tabIndex={-1}
              >
                <StoreIcons store={store} useBackground={true} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function lockButtonTitle(item: DimItem, type: 'lock' | 'track') {
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
