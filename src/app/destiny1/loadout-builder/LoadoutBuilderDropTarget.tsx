import clsx from 'clsx';
import React from 'react';
import { useDrop } from 'react-dnd';
import { DimItem } from '../../inventory/item-types';
import styles from './LoadoutBuilderDropTarget.m.scss';

export default function LoadoutBucketDropTarget({
  bucketHash,
  children,
  onItemLocked,
  className,
}: {
  bucketHash: number;
  className?: string;
  children?: React.ReactNode;
  onItemLocked: (lockedItem: DimItem) => void;
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop<
    DimItem,
    unknown,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: bucketHash.toString(),
      collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
      drop: onItemLocked,
      canDrop: (item) => item.bucket.hash === bucketHash,
    }),
    [bucketHash, onItemLocked],
  );
  return (
    <div
      ref={(el) => {
        dropRef(el);
      }}
      className={dropClasses(isOver, canDrop, className)}
    >
      {children}
    </div>
  );
}

export function dropClasses(isOver: boolean, canDrop: boolean, className?: string) {
  return clsx(className, {
    [styles.onDragHover]: canDrop && isOver,
    [styles.onDragEnter]: canDrop,
  });
}
