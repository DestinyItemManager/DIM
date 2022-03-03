import { DimItem } from 'app/inventory/item-types';
import clsx from 'clsx';
import React from 'react';
import { useDrop } from 'react-dnd';

interface Props {
  bucketHash: number;
  children?: React.ReactNode;
  onItemLocked(lockedItem: DimItem): void;
}

export default function LoadoutBucketDropTarget({ bucketHash, children, onItemLocked }: Props) {
  const [{ isOver, canDrop }, dropRef] = useDrop<
    DimItem,
    unknown,
    { isOver: Boolean; canDrop: boolean }
  >(
    () => ({
      accept: bucketHash.toString(),
      collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
      drop: onItemLocked,
      canDrop: (item) => item.bucket.hash === bucketHash,
    }),
    [bucketHash, onItemLocked]
  );
  return (
    <div
      ref={dropRef}
      className={clsx({
        'on-drag-hover': canDrop && isOver,
        'on-drag-enter': canDrop,
      })}
    >
      {children}
    </div>
  );
}
