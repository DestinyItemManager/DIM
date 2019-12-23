import React from 'react';
import { t } from 'app/i18next-t';
import styles from './ItemActions.m.scss';
import { AppIcon, lockIcon } from 'app/shell/icons';
import { Row } from 'react-table';
import { DimItem } from 'app/inventory/item-types';
import DropDown from './DropDown';
import { itemTagSelectorList, TagInfo } from 'app/inventory/dim-item-info';
import { DimStore } from 'app/inventory/store-types';

const bulkItemTags = Array.from(itemTagSelectorList);
bulkItemTags.shift();
bulkItemTags.push({ type: 'clear', label: 'Tags.ClearTag' });

function ItemActions({
  stores,
  selectedFlatRows,
  onLock,
  onTagSelectedItems,
  onMoveSelectedItems
}: {
  stores: DimStore[];
  selectedFlatRows: Row<DimItem>[];
  onLock(e: any): Promise<void>;
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
        disabled={selectedFlatRows.length === 0}
        name="lock"
        onClick={onLock}
      >
        Lock <AppIcon icon={lockIcon} />
      </button>
      <button
        className={`dim-button ${styles.actionButton}`}
        disabled={selectedFlatRows.length === 0}
        name="unlock"
        onClick={onLock}
      >
        Unlock <AppIcon icon={lockIcon} />
      </button>
      <span className={styles.actionButton}>
        <DropDown buttonText={t('Organizer.BulkTag')} dropDownItems={tagItems} />
      </span>
      <span className={styles.actionButton}>
        <DropDown buttonText={t('Organizer.BulkMove')} dropDownItems={moveItems} />
      </span>
    </div>
  );
}

export default ItemActions;
