import React from 'react';
import { loadingTracker } from 'app/shell/loading-tracker';
import { showNotification } from 'app/notifications/notifications';
import { getItemInfoSource, itemTagSelectorList, TagValue } from './dim-item-info';
import { t } from 'app/i18next-t';
import NotificationButton from 'app/notifications/NotificationButton';
import { AppIcon } from 'app/shell/icons';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import { DimItem } from './item-types';

export const bulkTagItems = loadingTracker.trackPromise(
  async (account, itemsToBeTagged: DimItem[], selectedTag: TagValue) => {
    const bulkItemTags = Array.from(itemTagSelectorList);
    const itemInfoService = await getItemInfoSource(account);
    const appliedTagInfo = bulkItemTags.find((tagInfo) => tagInfo.type === selectedTag) || {
      type: 'error',
      label: '[applied tag not found in tag list]'
    };

    // existing tags are later passed to buttonEffect so the notif button knows what to revert
    const previousState = itemsToBeTagged.map((item) => ({
      item,
      setTag: item.dimInfo.tag as TagValue
    }));

    await itemInfoService.bulkSaveByKeys(
      itemsToBeTagged.map((item) => ({
        key: item.id,
        notes: item.dimInfo.notes,
        tag: selectedTag === 'clear' ? undefined : selectedTag
      }))
    );

    showNotification({
      type: 'success',
      duration: 30000,
      title: t('Header.BulkTag'),
      body: (
        <>
          {appliedTagInfo.type === 'clear'
            ? t('Filter.BulkClear', {
                count: itemsToBeTagged.length,
                tag: t(appliedTagInfo.label)
              })
            : t('Filter.BulkTag', {
                count: itemsToBeTagged.length,
                tag: t(appliedTagInfo.label)
              })}
          <NotificationButton
            onClick={async () => {
              await itemInfoService.bulkSaveByKeys(
                previousState.map(({ item, setTag }) => ({
                  key: item.id,
                  notes: item.dimInfo.notes,
                  tag: selectedTag === 'clear' ? undefined : setTag
                }))
              );
              showNotification({
                type: 'success',
                title: t('Header.BulkTag'),
                body: t('Filter.BulkRevert', { count: previousState.length })
              });
            }}
          >
            <AppIcon icon={faUndo} /> {t('Filter.Undo')}
          </NotificationButton>
        </>
      )
    });
  }
);
