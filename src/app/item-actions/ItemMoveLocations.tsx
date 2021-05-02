import { StoreIcon } from 'app/character-tile/StoreIcon';
import PressTip from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { mobileDragType } from 'app/inventory/DraggableInventoryItem';
import { DimItem } from 'app/inventory/item-types';
import { moveItemTo } from 'app/inventory/move-item';
import { sortedStoresSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { amountOfItem, getStore, getVault } from 'app/inventory/stores-helpers';
import ActionButton from 'app/item-actions/ActionButton';
import { hideItemPopup } from 'app/item-popup/item-popup';
import ItemMoveAmount from 'app/item-popup/ItemMoveAmount';
import { canBePulledFromPostmaster } from 'app/loadout/postmaster';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React, { useMemo, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { useDispatch, useSelector } from 'react-redux';
import styles from './ItemMoveLocations.m.scss';

type MoveSubmit = (store: DimStore, equip?: boolean, moveAmount?: number) => void;

const sharedButtonProps = { role: 'button', tabIndex: -1 };

export default function ItemMoveLocations({
  item,
  mobileInspect,
  splitVault,
}: {
  item: DimItem;
  mobileInspect?: boolean;
  splitVault?: boolean;
}) {
  const stores = useSelector(sortedStoresSelector);
  const vault = getVault(stores);
  // barring a user selection, default to moving the whole stack of this item
  const [amount, setAmount] = useState(item.amount);
  const itemOwner = getStore(stores, item.owner);
  const dispatch = useDispatch();

  // If the item can't be transferred (or is unique) don't show the move amount slider
  const maximum = useMemo(
    () =>
      !itemOwner || item.maxStackSize <= 1 || item.notransfer || item.uniqueStack
        ? 1
        : amountOfItem(itemOwner, item),
    [itemOwner, item]
  );

  const submitMoveTo = (store: DimStore, equip = false, moveAmount = amount) => {
    dispatch(moveItemTo(item, store, equip, moveAmount));
    hideItemPopup();
  };

  if (!itemOwner) {
    return null;
  }

  const canEquip = stores.filter((store) => itemCanBeEquippedBy(item, store));
  const canStore = stores.filter((store) => canShowStore(store, itemOwner, item));

  return (
    <>
      {splitVault && vault && (
        <VaultActionButton
          item={item}
          vault={vault}
          owner={itemOwner}
          onClick={() => submitMoveTo(vault)}
        />
      )}

      {item.location.type === 'LostItems' ? (
        canBePulledFromPostmaster(item, itemOwner, stores) && (
          <PullButtons
            item={item}
            itemOwner={itemOwner}
            submitMoveTo={submitMoveTo}
            vault={vault}
          />
        )
      ) : (
        <>
          <MoveLocations
            label={t('MovePopup.Equip')}
            stores={stores}
            applicableStores={canEquip}
            equip={true}
            mobileInspect={mobileInspect}
            defaultPadding={splitVault}
            isDisplayedCheck={(store) => itemCanBeEquippedBy(item, store)}
            isDisabledCheck={(store) => item.owner === store.id && item.equipped}
            submitMoveTo={submitMoveTo}
          />
          <div className={styles.moveWithVault}>
            <MoveLocations
              label={t('MovePopup.Store')}
              shortcutKey=" [P]"
              stores={stores}
              applicableStores={canStore}
              mobileInspect={mobileInspect}
              defaultPadding={splitVault}
              isDisplayedCheck={(store) => canShowStore(store, itemOwner, item)}
              isDisabledCheck={(store) => !storeButtonEnabled(store, itemOwner, item)}
              submitMoveTo={submitMoveTo}
            />
            {!splitVault && vault && (
              <DropVaultButton
                item={item}
                store={vault}
                owner={itemOwner}
                mobileInspect={mobileInspect}
                handleMove={() => submitMoveTo(vault)}
              />
            )}
          </div>
        </>
      )}

      {maximum > 1 && (
        <ItemMoveAmount amount={amount} maximum={maximum} onAmountChanged={setAmount} />
      )}
    </>
  );
}

function DropLocation({
  children,
  store,
  equip,
  onDrop,
}: {
  children: React.ReactElement;
  store: DimStore;
  equip?: boolean;
  onDrop: () => void;
}) {
  const [{ hovering }, drop] = useDrop({
    accept: mobileDragType,
    drop: onDrop,
    collect: (monitor) => ({ hovering: Boolean(monitor.isOver()) }),
  });
  const ref = useRef<HTMLDivElement>(null);

  const title = equip
    ? t('MovePopup.EquipWithName', { character: store.name })
    : store.isVault
    ? t('MovePopup.SendToVault')
    : t('MovePopup.StoreWithName', { character: store.name });

  return (
    <PressTip.Control tooltip={title} triggerRef={ref} open={hovering}>
      {React.cloneElement(children, { ref: drop })}
    </PressTip.Control>
  );
}

function DropVaultButton({
  item,
  store,
  owner,
  mobileInspect,
  handleMove,
}: {
  item: DimItem;
  store: DimStore;
  owner: DimStore;
  mobileInspect?: boolean;
  handleMove: () => void;
}) {
  if (item.location.inPostmaster || !canTransferToVault(owner, item)) {
    return null;
  }

  return (
    <DropLocation store={store} onDrop={handleMove}>
      <div
        className={clsx(styles.move, styles.vaultButton, {
          [styles.mobileInspectButton]: mobileInspect,
        })}
        onClick={handleMove}
        {...sharedButtonProps}
      >
        <StoreIcon store={store} />
      </div>
    </DropLocation>
  );
}

function VaultActionButton({
  item,
  vault,
  owner,
  onClick,
}: {
  item: DimItem;
  vault: DimStore;
  owner: DimStore;
  onClick: () => void;
}) {
  if (item.location.inPostmaster || !canTransferToVault(owner, item)) {
    // PM items have an alternate vault button
    return null;
  }

  return (
    <ActionButton onClick={onClick} title={t('MovePopup.Vault') + ' [V]'}>
      <StoreIcon store={vault} /> <span className={styles.vaultLabel}>{t('MovePopup.Vault')}</span>
    </ActionButton>
  );
}

function MoveLocations({
  label,
  shortcutKey,
  stores,
  applicableStores,
  mobileInspect,
  defaultPadding,
  equip,
  isDisabledCheck,
  isDisplayedCheck,
  submitMoveTo,
}: {
  label: string;
  shortcutKey?: string;
  stores: DimStore[];
  applicableStores: DimStore[];
  defaultPadding?: boolean;
  mobileInspect?: boolean;
  equip?: boolean;
  /** is run on each store to decide whether its button is clickable */
  isDisabledCheck: (store: DimStore) => boolean;
  /** is run on each store to decide whether its button appears */
  isDisplayedCheck: (store: DimStore) => boolean;
  submitMoveTo: MoveSubmit;
}) {
  if (!applicableStores.length) {
    return null;
  }

  function moveLocation(store) {
    if (!isDisplayedCheck(store)) {
      return null;
    }

    const handleMove = () => submitMoveTo(store, equip);

    const button = (
      <div
        className={clsx({
          [styles.equip]: equip,
          [styles.move]: !equip,
          [styles.disabled]: isDisabledCheck(store),
          [styles.mobileInspectButton]: mobileInspect,
        })}
        title={`${label}${shortcutKey ? ' ' + shortcutKey : ''}`}
        onClick={handleMove}
        {...sharedButtonProps}
      >
        <StoreIcon store={store} useBackground={true} />
      </div>
    );

    return (
      <React.Fragment key={`${equip}-${store.id}`}>
        {!mobileInspect ? (
          button
        ) : (
          <DropLocation store={store} equip={equip} onDrop={handleMove}>
            {button}
          </DropLocation>
        )}
      </React.Fragment>
    );
  }

  return (
    <div
      className={clsx(styles.moveLocations, {
        [styles.moveLocationPadding]: defaultPadding,
      })}
    >
      {label}
      <div className={styles.moveLocationIcons}>{stores.map(moveLocation)}</div>
    </div>
  );
}

function PullButtons({
  item,
  itemOwner,
  submitMoveTo,
  vault,
}: {
  item: DimItem;
  itemOwner: DimStore;
  submitMoveTo: MoveSubmit;
  vault?: DimStore;
}) {
  const showAmounts = item.maxStackSize > 1 || item.bucket.hash === BucketHashes.Consumables;
  const moveAllLabel = showAmounts ? t('MovePopup.All') : undefined;

  return (
    <div className={clsx(styles.moveLocations, styles.moveLocationPadding)}>
      {t('MovePopup.PullPostmaster')}
      <div className={styles.moveLocationIcons}>
        {showAmounts && (
          <div
            className={styles.move}
            onClick={() => submitMoveTo(itemOwner, false, 1)}
            {...sharedButtonProps}
          >
            <StoreIcon store={itemOwner} useBackground={true} label="1" />
          </div>
        )}
        <div
          className={styles.move}
          onClick={() => submitMoveTo(itemOwner, false, item.amount)}
          {...sharedButtonProps}
        >
          <StoreIcon store={itemOwner} useBackground={true} label={moveAllLabel} />
        </div>

        {canTransferToVault(itemOwner, item) && (
          <div
            className={styles.move}
            onClick={() => submitMoveTo(vault!, false, item.amount)}
            {...sharedButtonProps}
          >
            <StoreIcon store={vault!} label={moveAllLabel} />
          </div>
        )}
      </div>
    </div>
  );
}

function canTransferToVault(itemOwnerStore: DimStore, item: DimItem): boolean {
  if (
    // item isn't in a store????
    !itemOwnerStore ||
    // Can't vault a vaulted item.
    itemOwnerStore.isVault ||
    // Can't move this item away from the current itemStore
    item.notransfer ||
    // moot point because it can't be claimed from the postmaster
    (item.location.inPostmaster && !item.canPullFromPostmaster)
  ) {
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
