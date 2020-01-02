import React, { ReactNode } from 'react';
import _ from 'lodash';
import { t } from 'app/i18next-t';
import styles from './Actions.m.scss';
import { AppIcon, lockIcon } from 'app/shell/icons';
import DropDown, { DropDownItem } from './DropDown';
import { itemTagList, TagInfo } from 'app/inventory/dim-item-info';
import { DimStore } from 'app/inventory/store-types';

export interface ColumnStatus {
  id: string;
  content: ReactNode;
  enabled: boolean;
  subColumnIds: string[];
}

const bulkItemTags = Array.from(itemTagList);
bulkItemTags.push({ type: 'clear', label: 'Tags.ClearTag' });

function getOnChangeColumnOrder(onChangeColumnOrder, columnStatusMap) {
  return (dropDownItems: DropDownItem[]) =>
    onChangeColumnOrder(dropDownItems.map((ddi) => columnStatusMap[ddi.id]));
}

function Actions({
  stores,
  itemsAreSelected,
  onLock,
  enabledColumns,
  onChangeEnabledColumn,
  onChangeColumnOrder,
  onTagSelectedItems,
  onMoveSelectedItems
}: {
  stores: DimStore[];
  itemsAreSelected: boolean;
  enabledColumns: ColumnStatus[];
  onChangeEnabledColumn(item: ColumnStatus): void;
  onChangeColumnOrder(columnStatus: ColumnStatus[]): void;
  onLock(e): Promise<void>;
  onTagSelectedItems(tagInfo: TagInfo): void;
  onMoveSelectedItems(store: DimStore): void;
}) {
  const columnStatusMap = _.keyBy(enabledColumns, (col) => col.id);
  const enabledColumnsItems: DropDownItem[] = [];

  for (const column of enabledColumns) {
    const { id, content } = column;

    if (id && content) {
      enabledColumnsItems.push({
        id,
        content,
        checked: column.enabled,
        onItemSelect: () => onChangeEnabledColumn(column)
      });
    }
  }

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
    <>
      <DropDown
        buttonText={t('Organizer.EnabledColumns')}
        dropDownItems={enabledColumnsItems}
        onOrderChange={getOnChangeColumnOrder(onChangeColumnOrder, columnStatusMap)}
      />
      <div className={styles.itemActions}>
        <button
          className={`dim-button ${styles.actionButton}`}
          disabled={!itemsAreSelected}
          name="lock"
          onClick={onLock}
        >
          Lock <AppIcon icon={lockIcon} />
        </button>
        <button
          className={`dim-button ${styles.actionButton}`}
          disabled={!itemsAreSelected}
          name="unlock"
          onClick={onLock}
        >
          Unlock <AppIcon icon={lockIcon} />
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
      </div>
    </>
  );
}

export default Actions;
