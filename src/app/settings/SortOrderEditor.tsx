import { t } from 'app/i18next-t';
import { reorder } from 'app/utils/collections';
import clsx from 'clsx';
import { clamp } from 'es-toolkit';
import { Reorder } from 'motion/react';
import { memo, useEffect, useState } from 'react';
import {
  AppIcon,
  dragHandleIcon,
  faCheckSquare,
  faSquare,
  maximizeIcon,
  minimizeIcon,
  moveDownIcon,
  moveUpIcon,
} from '../shell/icons';
import styles from './SortOrderEditor.m.scss';

export interface SortProperty {
  readonly id: string;
  readonly displayName: string;
  readonly enabled: boolean;
  readonly reversed: boolean;
}

type OnCommandHandler = (
  e: React.MouseEvent,
  index: number,
  command: 'up' | 'down' | 'toggle' | 'direction-toggle' | 'dragEnd',
) => void;

const SortEditorItemList = memo(
  ({
    order,
    onCommand,
    onDragEnd,
  }: {
    order: SortProperty[];
    onCommand: OnCommandHandler;
    onDragEnd: (item: SortProperty) => void;
  }) => (
    <>
      {order.map((item, index) => (
        <SortEditorItem
          key={item.id}
          item={item}
          index={index}
          onCommand={onCommand}
          onDragEnd={onDragEnd}
        />
      ))}
    </>
  ),
);

/**
 * An editor for sort-orders, with drag and drop.
 *
 * This is a "controlled component" - it fires an event when the order changes, and
 * must then be given back the new order by its parent.
 */
export default function SortOrderEditor({
  order,
  onSortOrderChanged,
}: {
  order: SortProperty[];
  onSortOrderChanged: (order: SortProperty[]) => void;
}) {
  // Local state for dragging - use the prop order as initial value
  const [currentOrder, setCurrentOrder] = useState(order);

  // Update local state when prop changes from parent
  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  const moveItem = (oldIndex: number, newIndex: number, fromDrag = false) => {
    newIndex = clamp(newIndex, 0, currentOrder.length);
    const newOrder = reorder(currentOrder, oldIndex, newIndex);
    if (fromDrag) {
      // Apply enabling logic and call parent callback
      const finalOrder = newOrder.map((item, index) => ({
        ...item,
        enabled: index === 0 || newOrder[index - 1].enabled,
      }));
      onSortOrderChanged(finalOrder);
    } else {
      // Just update local state for button clicks
      onSortOrderChanged(newOrder);
    }
  };

  const handleReorder = (newOrder: SortProperty[]) => {
    // During dragging, just update local state without applying business logic
    setCurrentOrder(newOrder);
  };

  const handleDragEnd = () => {
    // When drag ends, apply the enabling logic and notify parent
    const finalOrder = currentOrder.map((item, index) => ({
      ...item,
      enabled: index === 0 || currentOrder[index - 1].enabled,
    }));
    onSortOrderChanged(finalOrder);
  };

  const toggleItem = (index: number, prop: 'enabled' | 'reversed') => {
    const orderArr = Array.from(currentOrder);
    orderArr[index] = { ...orderArr[index], [prop]: !orderArr[index][prop] };
    onSortOrderChanged(orderArr);
  };

  const onCommand: OnCommandHandler = (e, index, command) => {
    switch (command) {
      case 'up': {
        e.preventDefault();
        moveItem(index, index - 1);
        break;
      }
      case 'down': {
        e.preventDefault();
        moveItem(index, index + 1);
        break;
      }
      case 'toggle': {
        e.preventDefault();
        toggleItem(index, 'enabled');
        break;
      }
      case 'direction-toggle': {
        e.preventDefault();
        toggleItem(index, 'reversed');
        break;
      }
      case 'dragEnd': {
        handleDragEnd(order[index]);
        break;
      }
      default:
        break;
    }
  };

  return (
    <Reorder.Group
      axis="y"
      values={currentOrder}
      onReorder={handleReorder}
      className={styles.editor}
      as="div"
    >
      <SortEditorItemList order={currentOrder} onCommand={onCommand} onDragEnd={handleDragEnd} />
    </Reorder.Group>
  );
}

function SortEditorItem({
  index,
  item,
  onCommand,
  onDragEnd,
}: {
  index: number;
  item: SortProperty;
  onCommand: OnCommandHandler;
  onDragEnd: (item: SortProperty) => void;
}) {
  return (
    <Reorder.Item
      value={item}
      className={clsx(styles.item, {
        [styles.disabled]: !item.enabled,
      })}
      whileDrag={{
        className: clsx(styles.item, styles.dragging, { [styles.disabled]: !item.enabled }),
      }}
      onDragEnd={() => onDragEnd(item)}
      as="div"
    >
      <span tabIndex={-1}>
        <AppIcon icon={dragHandleIcon} className={styles.grip} />
      </span>
      <button
        type="button"
        role="checkbox"
        aria-checked={item.enabled}
        className={styles.button}
        onClick={(e) => onCommand(e, index, 'toggle')}
      >
        <AppIcon icon={item.enabled ? faCheckSquare : faSquare} />
      </button>
      <span className={styles.name}>{item.displayName}</span>
      <button type="button" className={styles.button} onClick={(e) => onCommand(e, index, 'up')}>
        <AppIcon icon={moveUpIcon} />
      </button>
      <button type="button" className={styles.button} onClick={(e) => onCommand(e, index, 'down')}>
        <AppIcon icon={moveDownIcon} />
      </button>
      <button
        type="button"
        title={t('Settings.ReverseSort')}
        className={styles.button}
        onClick={(e) => onCommand(e, index, 'direction-toggle')}
      >
        <AppIcon
          icon={item.reversed ? maximizeIcon : minimizeIcon}
          className={
            item.enabled ? (item.reversed ? styles.sortReverse : styles.sortForward) : undefined
          }
        />
      </button>
    </Reorder.Item>
  );
}
