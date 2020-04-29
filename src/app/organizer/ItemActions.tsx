import React from 'react';
import { t } from 'app/i18next-t';
import styles from './ItemActions.m.scss';
import { AppIcon, lockIcon } from 'app/shell/icons';
import DropDown from './DropDown';
import { itemTagList, TagInfo } from 'app/inventory/dim-item-info';
import { DimStore } from 'app/inventory/store-types';

const bulkItemTags = Array.from(itemTagList);
bulkItemTags.push({ type: 'clear', label: 'Tags.ClearTag' });

function ItemActions({
  stores,
  itemsAreSelected,
  onLock,
  onTagSelectedItems,
  onMoveSelectedItems
}: {
  stores: DimStore[];
  itemsAreSelected: boolean;
  onLock(e): Promise<void>;
  onTagSelectedItems(tagInfo: TagInfo): void;
  onMoveSelectedItems(store: DimStore): void;
}) {
  const tagItems = bulkItemTags.map((tagInfo) => ({
    id: tagInfo.label,
    content: t(tagInfo.label),
    onItemSelect: () => onTagSelectedItems(tagInfo)
  }));

  const moveItems = stores.map((store) => ({
    id: store.id,
    content: store.name,
    onItemSelect: () => onMoveSelectedItems(store)
  }));

  return (
    <div className={styles.itemActions}>
      <button
        className={`dim-button ${styles.actionButton}`}
        disabled={!itemsAreSelected}
        name="lock"
        onClick={onLock}
      >
        {t('Organizer.Lock')} <AppIcon icon={lockIcon} />
      </button>
      <button
        className={`dim-button ${styles.actionButton}`}
        disabled={!itemsAreSelected}
        name="unlock"
        onClick={onLock}
      >
        {t('Organizer.Unlock')} <AppIcon icon={lockIcon} />
      </button>
      <span className={styles.actionButton}>
        <DropDown
          buttonText={t('Organizer.BulkTag')}
          buttonDisabled={!itemsAreSelected}
          dropDownItems={tagItems}
        />
      </span>
      <span className={styles.actionButton}>
        <DropDown
          buttonText={t('Organizer.BulkMove')}
          buttonDisabled={!itemsAreSelected}
          dropDownItems={moveItems}
        />
      </span>
      <span> {t('Organizer.ShiftTip')}</span>
    </div>
  );
}

export default ItemActions;
