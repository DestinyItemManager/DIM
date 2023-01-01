import { destinyVersionSelector } from 'app/accounts/selectors';
import { compareFilteredItems } from 'app/compare/actions';
import Dropdown, { Option } from 'app/dim-ui/Dropdown';
import { t } from 'app/i18next-t';
import { setNote } from 'app/inventory/actions';
import { bulkLockItems, bulkTagItems } from 'app/inventory/bulk-actions';
import { storesSortedByImportanceSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { itemMoveLoadout } from 'app/loadout-drawer/auto-loadouts';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { TagCommandInfo } from 'app/organizer/ItemActions';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { stripSockets } from 'app/strip-sockets/strip-sockets-actions';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { itemTagSelectorList, TagCommand } from '../inventory/dim-item-info';
import { DimItem } from '../inventory/item-types';
import {
  AppIcon,
  clearIcon,
  compareIcon,
  faWindowClose,
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
  const destinyVersion = useSelector(destinyVersionSelector);

  let isComparable = false;
  if (filteredItems.length) {
    const type = filteredItems[0].typeName;
    isComparable = filteredItems.every((i) => i.typeName === type);
  }

  const canStrip = filteredItems.some((i) =>
    i.sockets?.allSockets.some(
      (s) => s.emptyPlugItemHash && s.plugged?.plugDef.hash !== s.emptyPlugItemHash
    )
  );

  const bulkTag = loadingTracker.trackPromise(async (selectedTag: TagCommand) => {
    // Bulk tagging
    const tagItems = filteredItems.filter((i) => i.taggable);
    dispatch(bulkTagItems(tagItems, selectedTag));
  });

  const bulkLock = loadingTracker.trackPromise(async (selectedTag: 'lock' | 'unlock') => {
    // Bulk locking/unlocking
    const state = selectedTag === 'lock';
    const lockables = filteredItems.filter((i) => i.lockable);
    dispatch(bulkLockItems(lockables, state));
  });

  const bulkNote = () => {
    const note = prompt(t('Organizer.NotePrompt'));
    if (note !== null && filteredItems.length) {
      for (const item of filteredItems) {
        dispatch(setNote(item, note));
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

  const bulkItemTags: TagCommandInfo[] = itemTagSelectorList
    .filter((t) => t.type)
    .map((tag) => ({
      ...tag,
      label: t('Header.TagAs', { tag: t(tag.label) }),
    }));
  bulkItemTags.push({ type: 'clear', label: t('Tags.ClearTag'), icon: clearIcon });

  const dropdownOptions: Option[] = _.compact([
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
    destinyVersion === 2 && {
      key: 'strip-sockets',
      onSelected: () => stripSockets(searchQuery),
      disabled: !canStrip || !searchActive,
      content: (
        <>
          <AppIcon icon={faWindowClose} /> {t('StripSockets.Action')}
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
  ]);

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
