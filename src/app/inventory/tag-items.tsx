import React from 'react';
import { showNotification } from 'app/notifications/notifications';
import { tagConfig, TagValue, getTag } from './dim-item-info';
import { t } from 'app/i18next-t';
import NotificationButton from 'app/notifications/NotificationButton';
import { AppIcon, undoIcon } from 'app/shell/icons';
import { DimItem } from './item-types';
import { ThunkResult } from 'app/store/reducers';
import { setItemTagsBulk } from './actions';
import { itemInfosSelector } from './selectors';

export function bulkTagItems(itemsToBeTagged: DimItem[], selectedTag: TagValue): ThunkResult {
  return async (dispatch, getState) => {
    const appliedTagInfo = tagConfig[selectedTag];
    const itemInfos = itemInfosSelector(getState());

    // existing tags are later passed to buttonEffect so the notif button knows what to revert
    const previousState = itemsToBeTagged.map((item) => ({
      item,
      setTag: getTag(item, itemInfos),
    }));

    dispatch(
      setItemTagsBulk(
        itemsToBeTagged.map((item) => ({
          itemId: item.id,
          tag: selectedTag === 'clear' ? undefined : selectedTag,
        }))
      )
    );

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
              dispatch(
                setItemTagsBulk(
                  previousState.map(({ item, setTag }) => ({
                    itemId: item.id,
                    tag: setTag,
                  }))
                )
              );
              showNotification({
                type: 'success',
                title: t('Header.BulkTag'),
                body: t('Filter.BulkRevert', { count: previousState.length }),
              });
            }}
          >
            <AppIcon icon={undoIcon} /> {t('Filter.Undo')}
          </NotificationButton>
        </>
      ),
    });
  };
}
