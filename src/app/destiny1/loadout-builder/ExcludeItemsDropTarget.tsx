import { D1BucketHashes } from 'app/search/d1-known-values';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React from 'react';
import { useDrop } from 'react-dnd';
import { DimItem } from '../../inventory/item-types';

interface Props {
  className?: string;
  children?: React.ReactNode;
  onExcluded(lockedItem: DimItem): void;
}

export default function ExcludeItemsDropTarget({ className, children, onExcluded }: Props) {
  const [{ isOver, canDrop }, dropRef] = useDrop<
    DimItem,
    unknown,
    { isOver: Boolean; canDrop: boolean }
  >(
    () => ({
      accept: [
        BucketHashes.Helmet,
        BucketHashes.Gauntlets,
        BucketHashes.ChestArmor,
        BucketHashes.LegArmor,
        BucketHashes.ClassArmor,
        D1BucketHashes.Artifact,
        BucketHashes.Ghost,
      ].map((h) => h.toString()),
      collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
      drop: onExcluded,
    }),
    [onExcluded]
  );
  return (
    <div
      ref={dropRef}
      className={clsx(className, {
        'on-drag-hover': canDrop && isOver,
        'on-drag-enter': canDrop,
      })}
    >
      {children}
    </div>
  );
}
