import { DimItem } from './item-types';
import { ThunkResult } from 'app/store/types';
import { setItemLockState } from './item-move-service';
import { touchItem, touch } from './actions';
import { showNotification } from 'app/notifications/notifications';
import { t } from 'app/i18next-t';

/**
 * Bulk lock/unlock items
 * TODO: merge with tag-items.tsx
 */
export function bulkLockItems(items: DimItem[], locked: boolean): ThunkResult {
  return async (dispatch) => {
    try {
      for (const item of items) {
        await setItemLockState(item, locked);

        // TODO: Gotta do this differently in react land
        item.locked = locked;
        dispatch(touchItem(item.id));
      }
      showNotification({
        type: 'success',
        title: locked
          ? t('Filter.LockAllSuccess', { num: items.length })
          : t('Filter.UnlockAllSuccess', { num: items.length }),
      });
    } catch (e) {
      showNotification({
        type: 'error',
        title: locked ? t('Filter.LockAllFailed') : t('Filter.UnlockAllFailed'),
        body: e.message,
      });
    } finally {
      // Touch the stores service to update state
      if (items.length) {
        dispatch(touch());
      }
    }
  };
}
