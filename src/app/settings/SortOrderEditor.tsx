import { t } from 'app/i18next-t';
import { reorder } from 'app/utils/collections';
import clsx from 'clsx';
import { clamp } from 'es-toolkit';
import { Reorder, useDragControls } from 'motion/react';
import { useState } from 'react';
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
import * as styles from './SortOrderEditor.m.scss';

export interface SortProperty {
  readonly id: string;
  readonly displayName: string;
  readonly enabled: boolean;
  readonly reversed: boolean;
}

type OnCommandHandler = (
  e: React.MouseEvent,
  index: number,
  command: 'up' | 'down' | 'toggle' | 'direction-toggle',
) => void;

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
  const [draggingOrder, setDraggingOrder] = useState<SortProperty[] | undefined>();

  const moveItem = (oldIndex: number, newIndex: number, fromDrag = false) => {
    newIndex = clamp(newIndex, 0, order.length);
    const newOrder = reorder(order, oldIndex, newIndex);
    if (fromDrag) {
      newOrder[newIndex] = {
        ...newOrder[newIndex],
        enabled: newIndex === 0 || newOrder[newIndex - 1].enabled,
      };
    }
    onSortOrderChanged(newOrder);
  };

  const handleReorder = (newOrder: SortProperty[]) => {
    // During dragging, just update local state without applying business logic
    setDraggingOrder(newOrder);
  };

  const handleDragEnd = (item: SortProperty) => {
    if (!draggingOrder) {
      return; // No dragging in progress
    }
    // When drag ends, apply the enabling logic and notify parent
    const oldIndex = order.findIndex((i) => i.id === item.id);
    const newIndex = draggingOrder.findIndex((i) => i.id === item.id);
    moveItem(oldIndex, newIndex, true);
    setDraggingOrder(undefined); // Reset local state after drag ends
  };

  const toggleItem = (index: number, prop: 'enabled' | 'reversed') => {
    const orderArr = Array.from(order);
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
      default:
        break;
    }
  };

  // While dragging, use local state, but when we drop we'll go back to the
  // order from the prop.
  const currentOrder = draggingOrder ?? order;

  return (
    <Reorder.Group
      axis="y"
      values={currentOrder}
      onReorder={handleReorder}
      className={styles.editor}
      as="div"
    >
      {currentOrder.map((item, index) => (
        <SortEditorItem
          key={item.id}
          item={item}
          index={index}
          onCommand={onCommand}
          onDragEnd={handleDragEnd}
        />
      ))}
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
  const className = clsx(styles.item, {
    [styles.disabled]: !item.enabled,
  });
  // We use our own controls to avoid having the entire element be draggable.
  // Requires dragListener={false} on Reorder.Item.
  const controls = useDragControls();
  // Assign this to onPointerDown to start dragging from this item
  const startDrag = (e: React.PointerEvent) => controls.start(e);

  return (
    <Reorder.Item
      value={item}
      className={className}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        // I guess we can only do inline styles here
        outline: '1px solid var(--theme-accent-primary)',
      }}
      onDragEnd={() => onDragEnd(item)}
      as="div"
    >
      <span tabIndex={-1} onPointerDown={startDrag}>
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
      <span className={styles.name} onPointerDown={startDrag}>
        {item.displayName}
      </span>
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
