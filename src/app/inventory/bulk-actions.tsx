import { t } from 'app/i18next-t';
import NotificationButton from 'app/notifications/NotificationButton';
import { showNotification } from 'app/notifications/notifications';
import { AppIcon, undoIcon } from 'app/shell/icons';
import { ThunkResult } from 'app/store/types';
import _ from 'lodash';
import { setItemHashTag, setItemTagsBulk } from './actions';
import { getTag, tagConfig, TagValue } from './dim-item-info';
import { setItemLockState } from './item-move-service';
import { DimItem } from './item-types';
import { itemHashTagsSelector, itemInfosSelector } from './selectors';

/**
 * Bulk tag items, with an undo button in a notification.
 */
export function bulkTagItems(
  itemsToBeTagged: DimItem[],
  selectedTag: TagValue,
  notification = true
): ThunkResult {
  return async (dispatch, getState) => {
    const appliedTagInfo: { label: string } = tagConfig[selectedTag];
    const itemInfos = itemInfosSelector(getState());
    const itemHashTags = itemHashTagsSelector(getState());

    // existing tags are later passed to buttonEffect so the notification button knows what to revert
    const previousState = new Map<DimItem, TagValue | undefined>();
    for (const item of itemsToBeTagged) {
      previousState.set(item, getTag(item, itemInfos, itemHashTags));
    }

    const [instanced, nonInstanced] = _.partition(itemsToBeTagged, (i) => i.instanced);

    if (instanced.length) {
      dispatch(
        setItemTagsBulk(
          instanced.map((item) => ({
            itemId: item.id,
            tag: selectedTag === 'clear' ? undefined : selectedTag,
          }))
        )
      );
    }
    for (const item of nonInstanced) {
      dispatch(
        setItemHashTag({
          itemHash: item.hash,
          tag: selectedTag === 'clear' ? undefined : selectedTag,
        })
      );
    }
    if (notification) {
      showNotification({
        type: 'success',
        duration: 30000,
        title: t('Header.BulkTag'),
        body: (
          <>
            {selectedTag === 'clear'
              ? t('Filter.BulkClear', {
                  count: itemsToBeTagged.length,
                })
              : t('Filter.BulkTag', {
                  count: itemsToBeTagged.length,
                  tag: t(appliedTagInfo.label),
                })}
            <NotificationButton
              onClick={async () => {
                if (instanced.length) {
                  dispatch(
                    setItemTagsBulk(
                      instanced.map((item) => ({
                        itemId: item.id,
                        tag: previousState.get(item),
                      }))
                    )
                  );
                }
                if (nonInstanced.length) {
                  for (const item of nonInstanced) {
                    dispatch(
                      setItemHashTag({
                        itemHash: item.hash,
                        tag: previousState.get(item),
                      })
                    );
                  }
                }
                showNotification({
                  type: 'success',
                  title: t('Header.BulkTag'),
                  body: t('Filter.BulkRevert', { count: itemsToBeTagged.length }),
                });
              }}
            >
              <AppIcon icon={undoIcon} /> {t('Filter.Undo')}
            </NotificationButton>
          </>
        ),
      });
    }
  };
}

/**
 * Bulk lock/unlock items
 */
export function bulkLockItems(items: DimItem[], locked: boolean): ThunkResult {
  return async (dispatch) => {
    try {
      for (const item of items) {
        await dispatch(setItemLockState(item, locked));
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
    }
  };
}
