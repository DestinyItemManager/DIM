import React from 'react';
import { useDrop } from 'react-dnd';
import { D1Item } from '../../inventory/item-types';
import { d1ArmorTypes } from './D1LoadoutBuilder';
import { dropClasses } from './LoadoutBuilderDropTarget';

interface Props {
  className?: string;
  children?: React.ReactNode;
  onExcluded: (lockedItem: D1Item) => void;
}

export default function ExcludeItemsDropTarget({ className, children, onExcluded }: Props) {
  const [{ isOver, canDrop }, dropRef] = useDrop<
    D1Item,
    unknown,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: d1ArmorTypes.map((h) => h.toString()),
      collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
      drop: onExcluded,
    }),
    [onExcluded],
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
