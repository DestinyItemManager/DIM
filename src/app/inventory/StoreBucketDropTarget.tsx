import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { itemCanBeEquippedByStoreId } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import { useDrop } from 'react-dnd';
import { InventoryBucket } from './inventory-buckets';
import { DimItem } from './item-types';
import { dropItem } from './move-item';
import styles from './StoreBucketDropTarget.m.scss';

interface Props {
  bucket: InventoryBucket;
  storeId: string;
  storeClassType: DestinyClass;
  equip?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const onClick = () => {
  document.body.classList.remove('drag-perf-show');
};

export default function StoreBucketDropTarget({
  storeId,
  children,
  equip,
  className,
  storeClassType,
  bucket,
}: Props) {
  const dispatch = useThunkDispatch();
  const [{ isOver, canDrop }, dropRef] = useDrop<
    DimItem,
    unknown,
    { isOver: Boolean; canDrop: boolean }
  >(
    () => ({
      accept: bucket.inPostmaster
        ? []
        : [bucket.hash.toString(), `${storeId}-${bucket.hash}`, 'postmaster'],
      collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
      drop: (item) => dispatch(dropItem(item, storeId, Boolean(equip))),
      canDrop: (item) => {
        // You can drop anything that can be transferred into a non-equipped bucket
        if (!equip) {
          return true;
        }
        // But equipping has requirements
        return itemCanBeEquippedByStoreId(item, storeId, storeClassType);
      },
    }),
    [storeId, bucket, storeClassType, equip]
  );

  // TODO: I don't like that we're managing the classes for sub-bucket here
  return (
    <div
      ref={dropRef}
      className={clsx('sub-bucket', className, equip ? 'equipped' : 'unequipped', {
        [styles.over]: canDrop && isOver,
        [styles.canDrop]: canDrop,
      })}
      onClick={onClick}
      aria-label={bucket.name}
    >
      {children}
    </div>
  );
}
