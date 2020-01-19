import React from 'react';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { t } from 'app/i18next-t';
import ItemActionButton, { ItemActionButtonGroup } from './ItemActionButton';
import styles from './ItemMoveLocation.m.scss';

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
export default class ItemMoveLocation extends React.PureComponent<Props> {
  render() {
    const { item, store } = this.props;

    return (
      <ItemActionButtonGroup key={store.id}>
        {this.canShowVault(store) && (
          <ItemActionButton
            className={styles.moveVault}
            title={t('MovePopup.Vault')}
            aria-label={`${t('MovePopup.Equip')} ${store.name}`}
            onClick={this.moveItem}
            label={t('MovePopup.Vault')}
          />
        )}
        {!(item.owner === store.id && item.equipped) && item.canBeEquippedBy(store) && (
          <ItemActionButton
            title={store.name}
            aria-label={`${t('MovePopup.Equip')} ${store.name}`}
            onClick={this.equipItem}
            icon={store.icon}
            label={t('MovePopup.Equip')}
          />
        )}
        {this.canShowStore(store) && (
          <ItemActionButton
            title={store.name}
            aria-label={`${t('MovePopup.Store')} ${store.name}`}
            onClick={this.moveItem}
            icon={store.icon}
            label={t('MovePopup.Store')}
          />
        )}
      </ItemActionButtonGroup>
    );
  }

  private moveItem = () => this.props.moveItemTo(this.props.store);
  private equipItem = () => this.props.moveItemTo(this.props.store, true);

  private canShowVault = (buttonStore: DimStore): boolean => {
    const { item, itemOwnerStore: store } = this.props;

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

  private canShowStore = (buttonStore: DimStore): boolean => {
    const { item, itemOwnerStore: store } = this.props;

    // Can't store into a vault
    if (buttonStore.isVault || !store) {
      return false;
    }

    // Don't show "Store" for finishers, seasonal artifacts, or clan banners
    if (
      item.location.capacity === 1 ||
      item.location.hash === 1506418338 ||
      item.location.hash === 3683254069
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
}
