import { DragObject } from 'app/inventory/DraggableInventoryItem';
import clsx from 'clsx';
import React from 'react';
import { useDrop } from 'react-dnd';
import { DimItem } from '../../inventory/item-types';

interface Props {
  bucketType: string;
  children?: React.ReactNode;
  onItemLocked(lockedItem: DimItem): void;
}

export default function LoadoutBucketDropTarget({ bucketType, children, onItemLocked }: Props) {
  const [{ isOver, canDrop }, dropRef] = useDrop<
    DragObject,
    unknown,
    { isOver: Boolean; canDrop: boolean }
  >(
    () => ({
      accept: bucketType,
      collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
      drop: ({ item }) => onItemLocked(item),
      canDrop: ({ item }) => item.bucket.type === bucketType,
    }),
    [bucketType, onItemLocked]
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
