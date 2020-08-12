import React from 'react';
import { showNotification } from 'app/notifications/notifications';
import { tagConfig, TagValue, getTag } from './dim-item-info';
import { t } from 'app/i18next-t';
import NotificationButton from 'app/notifications/NotificationButton';
import { AppIcon, undoIcon } from 'app/shell/icons';
import { DimItem } from './item-types';
import { ThunkResult } from 'app/store/types';
import { setItemTagsBulk, setItemHashTag } from './actions';
import { itemInfosSelector, itemHashTagsSelector } from './selectors';
import _ from 'lodash';

export function bulkTagItems(itemsToBeTagged: DimItem[], selectedTag: TagValue): ThunkResult {
  return async (dispatch, getState) => {
    const appliedTagInfo = tagConfig[selectedTag];
    const itemInfos = itemInfosSelector(getState());
    const itemHashTags = itemHashTagsSelector(getState());

    // existing tags are later passed to buttonEffect so the notif button knows what to revert
    const previousState = new Map<DimItem, TagValue | undefined>();
    for (const item of itemsToBeTagged) {
      previousState.set(item, getTag(item, itemInfos, itemHashTags));
    }

    const [instanced, nonInstanced] = _.partition(itemsToBeTagged, (i) => i.id && i.id !== '0');

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
    if (nonInstanced.length) {
      for (const item of nonInstanced) {
        dispatch(
          setItemHashTag({
            itemHash: item.hash,
            tag: selectedTag === 'clear' ? undefined : selectedTag,
          })
        );
      }
    }

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
  };
}
