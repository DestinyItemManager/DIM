import { D1BucketHashes } from 'app/search/d1-known-values';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import React from 'react';
import { useDrop } from 'react-dnd';
import { D1Item } from '../../inventory/item-types';

interface Props {
  className?: string;
  children?: React.ReactNode;
  onExcluded: (lockedItem: D1Item) => void;
}

export default function ExcludeItemsDropTarget({ className, children, onExcluded }: Props) {
  const [{ isOver, canDrop }, dropRef] = useDrop<
    D1Item,
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
