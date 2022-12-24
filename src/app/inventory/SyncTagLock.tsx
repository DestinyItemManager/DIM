import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { errorLog, infoLog } from 'app/utils/log';
import { memo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { getTag, ItemInfos } from './dim-item-info';
import { setItemLockState } from './item-move-service';
import { DimItem } from './item-types';
import { allItemsSelector, itemInfosSelector } from './selectors';

/**
 * Rather than getting all items that need to change lock state, we return just the first.
 * Once that item changes state, the selector will return the next item, and so on.
 */
function getNextItemToChangeLockState(
  allItems: DimItem[],
  itemInfos: ItemInfos
): [item: DimItem, lock: boolean] | [] {
  for (const item of allItems) {
    if (item.lockable && item.taggable) {
      switch (getTag(item, itemInfos)) {
        case 'favorite':
        case 'keep':
        case 'archive': {
          if (!item.locked) {
            return [item, true];
          }
          break;
        }

        case 'infuse':
        case 'junk': {
          if (item.locked) {
            return [item, false];
          }
          break;
        }

        case undefined:
          break;
      }
    }
  }
  return [];
}

const getNextItemSelector = createSelector(
  allItemsSelector,
  itemInfosSelector,
  getNextItemToChangeLockState
);

// Some extra protection against locking the same thing twice in parallel - for example if you
// refreshed inventory while locking was already going on. We don't care so much if two separate items
// lock in parallel though.
const inProgressLocks = new Set<string>();

/**
 * While this (invisible) component is in the tree, it will watch changes to the inventory and tag state,
 * and sync the tag state with the lock state. e.g. favorite items are always locked, junk items are always
 * unlocked.
 */
export default memo(function SyncTagLock() {
  const dispatch = useThunkDispatch();
  const [nextItem, lock] = useSelector(getNextItemSelector);

  useEffect(() => {
    if (nextItem && lock !== undefined && !inProgressLocks.has(nextItem.id)) {
      (async () => {
        infoLog(
          'autoLockTagged',
          lock ? 'Locking' : 'Unlocking',
          nextItem.name,
          'to match its tag'
        );
        inProgressLocks.add(nextItem.id);
        try {
          await dispatch(setItemLockState(nextItem, lock));
        } catch (e) {
          errorLog(
            'autoLockTagged',
            'Failed to ',
            lock ? 'lock' : 'unlock',
            nextItem.name,
            'to match its tag:',
            e
          );
        } finally {
          inProgressLocks.delete(nextItem.id);
        }
      })();
    }
  }, [nextItem, lock, dispatch]);

  return null;
});
