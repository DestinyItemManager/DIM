import { compareFilteredItems } from 'app/compare/actions';
import Dropdown, { Option } from 'app/dim-ui/Dropdown';
import { t } from 'app/i18next-t';
import { setItemNote } from 'app/inventory/actions';
import { bulkLockItems, bulkTagItems } from 'app/inventory/bulk-actions';
import { storesSortedByImportanceSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { itemMoveLoadout } from 'app/loadout/auto-loadouts';
import { applyLoadout } from 'app/loadout/loadout-apply';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import React from 'react';
import { useSelector } from 'react-redux';
import { isTagValue, itemTagSelectorList, TagValue } from '../inventory/dim-item-info';
import { DimItem } from '../inventory/item-types';
import {
  AppIcon,
  clearIcon,
  compareIcon,
  lockIcon,
  stickyNoteIcon,
  unlockedIcon,
} from '../shell/icons';
import { loadingTracker } from '../shell/loading-tracker';
import styles from './ItemActionsDropdown.m.scss';

interface Props {
  searchQuery: string;
  filteredItems: DimItem[];
  searchActive: boolean;
  fixed?: boolean;
}

/**
 * Various actions that can be performed on an item
 */
export default React.memo(function ItemActionsDropdown({
  searchActive,
  filteredItems,
  searchQuery,
  fixed,
}: Props) {
  const dispatch = useThunkDispatch();
  const isPhonePortrait = useIsPhonePortrait();
  const stores = useSelector(storesSortedByImportanceSelector);

  let isComparable = false;
  if (filteredItems.length) {
    const type = filteredItems[0].typeName;
    isComparable = filteredItems.every((i) => i.typeName === type);
  }

  const bulkTag = loadingTracker.trackPromise(async (selectedTag: TagValue) => {
    // Bulk tagging
    const tagItems = filteredItems.filter((i) => i.taggable);

    if (isTagValue(selectedTag)) {
      dispatch(bulkTagItems(tagItems, selectedTag));
    }
  });

  const bulkLock = loadingTracker.trackPromise(async (selectedTag: TagValue) => {
    // Bulk locking/unlocking
    const state = selectedTag === 'lock';
    const lockables = filteredItems.filter((i) => i.lockable);
    dispatch(bulkLockItems(lockables, state));
  });

  const bulkNote = () => {
    const note = prompt(t('Organizer.NotePrompt'));
    if (note !== null && filteredItems.length) {
      for (const item of filteredItems) {
        dispatch(setItemNote({ itemId: item.id, note: note || undefined }));
      }
    }
  };

  const compareMatching = () => {
    dispatch(compareFilteredItems(searchQuery, filteredItems));
  };

  // Move items matching the current search. Max 9 per type.
  const applySearchLoadout = async (store: DimStore) => {
    const loadout = itemMoveLoadout(filteredItems, store);
    dispatch(applyLoadout(store, loadout, { allowUndo: true }));
  };

  const bulkItemTags = itemTagSelectorList
    .filter((t) => t.type)
    .map((tag) => ({
      ...tag,
      label: t('Header.TagAs', { tag: t(tag.label) }),
    }));
  bulkItemTags.push({ type: 'clear', label: t('Tags.ClearTag'), icon: clearIcon });

  const dropdownOptions: Option[] = [
    ...stores.map((store) => ({
      key: `move-${store.id}`,
      onSelected: () => applySearchLoadout(store),
      disabled: !searchActive,
      content: (
        <>
          <img src={store.icon} width="16" height="16" alt="" className={styles.storeIcon} />{' '}
          {store.isVault
            ? t('MovePopup.SendToVault')
            : t('MovePopup.StoreWithName', { character: store.name })}
        </>
      ),
    })),
    { key: 'characters' },
    {
      key: 'compare',
      onSelected: compareMatching,
      disabled: !isComparable || !searchActive,
      content: (
        <>
          <AppIcon icon={compareIcon} /> {t('Header.CompareMatching')}
        </>
      ),
    },
    {
      key: 'note',
      onSelected: () => bulkNote(),
      disabled: !searchActive,
      content: (
        <>
          <AppIcon icon={stickyNoteIcon} /> {t('Organizer.Note')}
        </>
      ),
    },
    {
      key: 'lock-item',
      onSelected: () => bulkLock('lock'),
      disabled: !searchActive,
      content: (
        <>
          <AppIcon icon={lockIcon} /> {t('Tags.LockAll')}
        </>
      ),
    },
    {
      key: 'unlock-item',
      onSelected: () => bulkLock('unlock'),
      disabled: !searchActive,
      content: (
        <>
          <AppIcon icon={unlockedIcon} /> {t('Tags.UnlockAll')}
        </>
      ),
    },
    { key: 'tags' },
    ...bulkItemTags.map((tag) => ({
      key: tag.type || 'default',
      onSelected: () => tag.type && bulkTag(tag.type),
      disabled: !searchActive,
      content: (
        <>
          {tag.icon && <AppIcon icon={tag.icon} />} {tag.label}
        </>
      ),
    })),
  ];

  return (
    <Dropdown
      options={dropdownOptions}
      kebab={true}
      className={styles.dropdownButton}
      offset={isPhonePortrait ? 10 : 3}
      fixed={fixed}
    />
  );
});
