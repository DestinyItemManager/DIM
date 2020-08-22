import React from 'react';
import { t } from 'app/i18next-t';
import styles from './ItemActions.m.scss';
import { AppIcon, lockIcon, stickyNoteIcon, tagIcon, moveIcon } from 'app/shell/icons';
import DropDown, { DropDownItem } from './DropDown';
import { itemTagList, TagInfo } from 'app/inventory/dim-item-info';
import { DimStore } from 'app/inventory/store-types';

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
  const tagItems: DropDownItem[] = bulkItemTags.map((tagInfo) => ({
    id: tagInfo.label,
    content: (
      <>
        {tagInfo.icon && <AppIcon icon={tagInfo.icon} />} {t(tagInfo.label)}
      </>
    ),
    onItemSelect: () => onTagSelectedItems(tagInfo),
  }));

  const moveItems: DropDownItem[] = stores.map((store) => ({
    id: store.id,
    content: (
      <>
        <img height="16" width="16" src={store.icon} /> {store.name}
      </>
    ),
    onItemSelect: () => onMoveSelectedItems(store),
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
        <AppIcon icon={lockIcon} /> {t('Organizer.Unlock')}
      </button>
      <span className={styles.actionButton}>
        <DropDown
          buttonText={
            <>
              <AppIcon icon={tagIcon} /> {t('Organizer.BulkTag')}
            </>
          }
          buttonDisabled={!itemsAreSelected}
          dropDownItems={tagItems}
        />
      </span>
      <span className={styles.actionButton}>
        <DropDown
          buttonText={
            <>
              <AppIcon icon={moveIcon} /> {t('Organizer.BulkMove')}
            </>
          }
          buttonDisabled={!itemsAreSelected}
          dropDownItems={moveItems}
        />
      </span>
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
