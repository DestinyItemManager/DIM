import { bucketTypesSelector } from 'app/loadout-drawer/LoadoutDrawerDropTarget';
import clsx from 'clsx';
import React from 'react';
import { useDrop } from 'react-dnd';
import { useSelector } from 'react-redux';
import { DimItem } from '../inventory/item-types';
import styles from './LoadoutBucketDropTarget.m.scss';

interface Props {
  className?: string;
  children?: React.ReactNode;
  onItemLocked: (lockedItem: DimItem) => void;
}

/**
 * This allows us to drop loadout builder items.
 */
export default function LoadoutBucketDropTarget({ onItemLocked, children, className }: Props) {
  const bucketTypes = useSelector(bucketTypesSelector);

  const [{ isOver, canDrop }, dropRef] = useDrop<
    DimItem,
    unknown,
    { isOver: Boolean; canDrop: boolean }
  >(
    () => ({
      accept: bucketTypes,
      collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
      drop: onItemLocked,
    }),
    [bucketTypes, onItemLocked],
  );
  return (
    <div
      ref={dropRef}
      className={clsx(className, {
        [styles.over]: canDrop && isOver,
        [styles.canDrop]: canDrop,
      })}
    >
      {children}
    </div>
  );
}
