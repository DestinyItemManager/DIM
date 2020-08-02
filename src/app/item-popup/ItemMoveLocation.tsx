import React from 'react';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { t } from 'app/i18next-t';
import ItemActionButton, { ItemActionButtonGroup } from './ItemActionButton';
import styles from './ItemMoveLocation.m.scss';
import { FINISHERS_BUCKET, SEASONAL_ARTIFACT_BUCKET } from 'app/search/d2-known-values';

interface Props {
  item: DimItem;
  itemOwnerStore: DimStore;
  store: DimStore;
  moveItemTo(store: DimStore, equip?: boolean): void;
}

/**
 * Buttons for the ItemActions component. These show the applicable
 * actions for the given store to move/equip the given item.
 */
export default function ItemMoveLocation({ item, itemOwnerStore, store, moveItemTo }: Props) {
  const moveItem = () => moveItemTo(store);
  const equipItem = () => moveItemTo(store, true);

  const canShowVault = (buttonStore: DimStore): boolean => {
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
  };

  const canShowStore = (buttonStore: DimStore): boolean => {
    const store = itemOwnerStore;

    // Can't store into a vault
    if (buttonStore.isVault || !store) {
      return false;
    }

    // Don't show "Store" for finishers, seasonal artifacts, or clan banners
    if (
      item.location.capacity === 1 ||
      item.location.hash === SEASONAL_ARTIFACT_BUCKET ||
      item.location.hash === FINISHERS_BUCKET
    ) {
      return false;
    }

    // Can pull items from the postmaster.
    if (item.location.inPostmaster && item.location.type !== 'Engrams') {
      return item.isDestiny2() && item.canPullFromPostmaster;
    } else if (item.notransfer) {
      // Can store an equiped item in same itemStore
      if (item.equipped && store.id === buttonStore.id) {
        return true;
      }
    } else if (store.id !== buttonStore.id || item.equipped) {
      // In Destiny2, only show one store for account wide items
      if (item.isDestiny2() && item.bucket?.accountWide && !buttonStore.current) {
        return false;
      } else {
        return true;
      }
    }

    return false;
  };

  return (
    <ItemActionButtonGroup key={store.id}>
      {canShowVault(store) && (
        <ItemActionButton
          className={styles.moveVault}
          title={t('MovePopup.Vault')}
          aria-label={`${t('MovePopup.Equip')} ${store.name}`}
          onClick={moveItem}
          label={t('MovePopup.Vault')}
        />
      )}
      {!(item.owner === store.id && item.equipped) && item.canBeEquippedBy(store) && (
        <ItemActionButton
          title={store.name}
          aria-label={`${t('MovePopup.Equip')} ${store.name}`}
          onClick={equipItem}
          icon={store.icon}
          label={t('MovePopup.Equip')}
        />
      )}
      {canShowStore(store) && (
        <ItemActionButton
          title={store.name}
          aria-label={`${t('MovePopup.Store')} ${store.name}`}
          onClick={moveItem}
          icon={store.icon}
          label={t('MovePopup.Store')}
        />
      )}
    </ItemActionButtonGroup>
  );
}
