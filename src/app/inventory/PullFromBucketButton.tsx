import { t } from 'app/i18next-t';
import { ThunkDispatchProp } from 'app/store/types';
import { itemCanBeEquippedBy } from 'app/utils/item-utils';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { showItemPicker } from '../item-picker/item-picker';
import { addIcon, AppIcon } from '../shell/icons';
import { InventoryBucket } from './inventory-buckets';
import { DimItem } from './item-types';
import { moveItemTo } from './move-item';
import { DimStore } from './store-types';

interface Props {
  className?: string;
  label?: string;
  store: DimStore;
  bucket: InventoryBucket;
}

export default function PullFromBucketButton({ label, className, bucket, store }: Props) {
  const dispatch = useDispatch<ThunkDispatchProp['dispatch']>();

  const pullItem = useCallback(async () => {
    try {
      const { item } = await showItemPicker({
        filterItems: (item: DimItem) =>
          item.bucket.hash === bucket.hash &&
          itemCanBeEquippedBy(item, store) &&
          item.owner !== store.id, // Filter items that are already on the character
        prompt: t('MovePopup.PullItem', {
          bucket: bucket.name,
          store: store.name,
        }),
      });

      dispatch(moveItemTo(item, store));
    } catch (e) {}
  }, [bucket.hash, bucket.name, dispatch, store]);

  if (!bucket.hasTransferDestination) {
    return null;
  }

  return (
    <a
      onClick={pullItem}
      className={className}
      title={t('MovePopup.PullItem', {
        bucket: bucket.name,
        store: store.name,
      })}
    >
      <AppIcon icon={addIcon} />
      {label}
    </a>
  );
}
