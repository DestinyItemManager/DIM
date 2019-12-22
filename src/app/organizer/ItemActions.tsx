import React from 'react';
import { t } from 'app/i18next-t';
import styles from './ItemActions.m.scss';
import { AppIcon, lockIcon } from 'app/shell/icons';
import { Row } from 'react-table';
import { DimItem } from 'app/inventory/item-types';
import DropDown from './DropDown';
import { itemTagSelectorList } from 'app/inventory/dim-item-info';

function ItemActions({
  storeNames,
  selectedFlatRows,
  onLock
}: {
  storeNames: string[];
  selectedFlatRows: Row<DimItem>[];
  onLock(e: any): Promise<void>;
}) {
  const tagItems = itemTagSelectorList.map((tagInfo) => ({
    id: tagInfo.label,
    content: t(tagInfo.label)
  }));

  const moveItems = storeNames.map((name) => ({
    id: name,
    content: name
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
        <DropDown buttonText="Tag" dropDownItems={tagItems} onItemSelect={() => {}} />
      </span>
      <span className={styles.actionButton}>
        <DropDown buttonText="Move to" dropDownItems={moveItems} onItemSelect={() => {}} />
      </span>
    </div>
  );
}

export default ItemActions;
