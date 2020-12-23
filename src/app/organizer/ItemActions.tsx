import Dropdown, { Option } from 'app/dim-ui/Dropdown';
import { t } from 'app/i18next-t';
import { itemTagList, TagInfo } from 'app/inventory/dim-item-info';
import { DimStore } from 'app/inventory/store-types';
import {
  AppIcon,
  lockIcon,
  moveIcon,
  stickyNoteIcon,
  tagIcon,
  unlockedIcon,
} from 'app/shell/icons';
import React from 'react';
import styles from './ItemActions.m.scss';

const bulkItemTags = Array.from(itemTagList);
bulkItemTags.push({ type: 'clear', label: 'Tags.ClearTag' });

function ItemActions({
  stores,
  itemsAreSelected,
  onLock,
  onNote,
  onTagSelectedItems,
  onMoveSelectedItems,
}: {
  stores: DimStore[];
  itemsAreSelected: boolean;
  onLock(locked: boolean): void;
  onNote(note?: string): void;
  onTagSelectedItems(tagInfo: TagInfo): void;
  onMoveSelectedItems(store: DimStore): void;
}) {
  const tagItems: Option[] = bulkItemTags.map((tagInfo) => ({
    key: tagInfo.label,
    content: (
      <>
        {tagInfo.icon && <AppIcon icon={tagInfo.icon} />} {t(tagInfo.label)}
      </>
    ),
    onSelected: () => onTagSelectedItems(tagInfo),
  }));

  const moveItems: Option[] = stores.map((store) => ({
    key: store.id,
    content: (
      <>
        <img height="16" width="16" src={store.icon} /> {store.name}
      </>
    ),
    onSelected: () => onMoveSelectedItems(store),
  }));

  const noted = () => {
    const note = prompt(t('Organizer.NotePrompt'));
    if (note !== null) {
      onNote(note || undefined);
    }
  };

  return (
    <div className={styles.itemActions}>
      <button
        type="button"
        className={`dim-button ${styles.actionButton}`}
        disabled={!itemsAreSelected}
        name="lock"
        onClick={() => onLock(true)}
      >
        <AppIcon icon={lockIcon} /> {t('Organizer.Lock')}
      </button>
      <button
        type="button"
        className={`dim-button ${styles.actionButton}`}
        disabled={!itemsAreSelected}
        name="unlock"
        onClick={() => onLock(false)}
      >
        <AppIcon icon={unlockedIcon} /> {t('Organizer.Unlock')}
      </button>
      <Dropdown disabled={!itemsAreSelected} options={tagItems} className={styles.actionButton}>
        <AppIcon icon={tagIcon} /> {t('Organizer.BulkTag')}
      </Dropdown>
      <Dropdown disabled={!itemsAreSelected} options={moveItems} className={styles.actionButton}>
        <AppIcon icon={moveIcon} /> {t('Organizer.BulkMove')}
      </Dropdown>
      <button
        type="button"
        className={`dim-button ${styles.actionButton}`}
        disabled={!itemsAreSelected}
        name="note"
        onClick={noted}
      >
        <AppIcon icon={stickyNoteIcon} /> {t('Organizer.Note')}
      </button>
      <span className={styles.tip}> {t('Organizer.ShiftTip')}</span>
    </div>
  );
}

export default ItemActions;
