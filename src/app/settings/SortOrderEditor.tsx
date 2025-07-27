import { t } from 'app/i18next-t';
import { reorder } from 'app/utils/collections';
import clsx from 'clsx';
import { clamp } from 'es-toolkit';
import { Reorder } from 'motion/react';
import { memo } from 'react';
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
  ({ order, onCommand }: { order: SortProperty[]; onCommand: OnCommandHandler }) => (
    <>
      {order.map((item, index) => (
        <SortEditorItem key={item.id} item={item} index={index} onCommand={onCommand} />
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
    onSortOrderChanged(newOrder);
  };

  const handleDragEnd = (draggedItem: SortProperty) => {
    // Find the current index of the dragged item
    const draggedItemIndex = order.findIndex((item) => item.id === draggedItem.id);

    if (draggedItemIndex !== -1) {
      const newOrder = [...order];
      newOrder[draggedItemIndex] = {
        ...newOrder[draggedItemIndex],
        enabled: draggedItemIndex === 0 || newOrder[draggedItemIndex - 1].enabled,
      };
      onSortOrderChanged(newOrder);
    }
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
      values={order}
      onReorder={handleReorder}
      className={styles.editor}
      as="div"
    >
      <SortEditorItemList order={order} onCommand={onCommand} />
    </Reorder.Group>
  );
}

function SortEditorItem({
  index,
  item,
  onCommand,
}: {
  index: number;
  item: SortProperty;
  onCommand: OnCommandHandler;
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
      onDragEnd={() => onCommand({} as React.MouseEvent, index, 'dragEnd')}
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
