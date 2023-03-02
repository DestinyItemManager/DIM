import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import Dropdown, { Option } from 'app/dim-ui/Dropdown';
import usePrompt from 'app/dim-ui/usePrompt';
import { t } from 'app/i18next-t';
import { itemTagList, TagCommand } from 'app/inventory/dim-item-info';
import { DimStore } from 'app/inventory/store-types';
import {
  AppIcon,
  lockIcon,
  moveIcon,
  stickyNoteIcon,
  tagIcon,
  unlockedIcon,
} from 'app/shell/icons';
import styles from './ItemActions.m.scss';

export interface TagCommandInfo {
  type?: TagCommand;
  label: string;
  sortOrder?: number;
  displacePriority?: number;
  hotkey?: string;
  icon?: string | IconDefinition;
}

const bulkItemTags: TagCommandInfo[] = Array.from(itemTagList);
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
  onLock: (locked: boolean) => void;
  onNote: (note?: string) => void;
  onTagSelectedItems: (tagInfo: TagCommandInfo) => void;
  onMoveSelectedItems: (store: DimStore) => void;
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

  // TODO: replace with rich-text dialog, and an "append" option
  const [promptDialog, prompt] = usePrompt();
  const noted = async () => {
    const note = await prompt(t('Organizer.NotePrompt'));
    if (note !== null) {
      onNote(note || undefined);
    }
  };

  return (
    <div className={styles.itemActions}>
      {promptDialog}
      <button
        type="button"
        className={`dim-button ${styles.actionButton}`}
        disabled={!itemsAreSelected}
        name="lock"
        onClick={() => onLock(true)}
      >
        <AppIcon icon={lockIcon} />
        <span className={styles.label}>{t('Organizer.Lock')}</span>
      </button>
      <button
        type="button"
        className={`dim-button ${styles.actionButton}`}
        disabled={!itemsAreSelected}
        name="unlock"
        onClick={() => onLock(false)}
      >
        <AppIcon icon={unlockedIcon} />
        <span className={styles.label}>{t('Organizer.Unlock')}</span>
      </button>
      <Dropdown disabled={!itemsAreSelected} options={tagItems} className={styles.actionButton}>
        <AppIcon icon={tagIcon} />
        <span className={styles.label}>{t('Organizer.BulkTag')}</span>
      </Dropdown>
      <Dropdown disabled={!itemsAreSelected} options={moveItems} className={styles.actionButton}>
        <AppIcon icon={moveIcon} />
        <span className={styles.label}>{t('Organizer.BulkMove')}</span>
      </Dropdown>
      <button
        type="button"
        className={`dim-button ${styles.actionButton}`}
        disabled={!itemsAreSelected}
        name="note"
        onClick={noted}
      >
        <AppIcon icon={stickyNoteIcon} />
        <span className={styles.label}>{t('Organizer.Note')}</span>
      </button>
      <span className={styles.tip}> {t('Organizer.ShiftTip')}</span>
    </div>
  );
}

export default ItemActions;
