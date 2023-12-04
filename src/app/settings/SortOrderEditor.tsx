import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { t } from 'app/i18next-t';
import { reorder } from 'app/utils/collections';
import clsx from 'clsx';
import _ from 'lodash';
import React, { memo } from 'react';
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

const SortEditorItemList = memo(({ order }: { order: SortProperty[] }) => (
  <>
    {order.map((item, index) => (
      <SortEditorItem key={item.id} item={item} index={index} />
    ))}
  </>
));

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
    newIndex = _.clamp(newIndex, 0, order.length);
    const newOrder = reorder(order, oldIndex, newIndex);
    if (fromDrag) {
      newOrder[newIndex] = {
        ...newOrder[newIndex],
        enabled: newIndex === 0 || newOrder[newIndex - 1].enabled,
      };
    }
    onSortOrderChanged(newOrder);
  };

  const onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    moveItem(result.source.index, result.destination.index, true);
  };

  const toggleItem = (index: number, prop: 'enabled' | 'reversed') => {
    const orderArr = Array.from(order);
    orderArr[index] = { ...orderArr[index], [prop]: !orderArr[index][prop] };
    onSortOrderChanged(orderArr);
  };

  const onClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const getIndex = () => parseInt(target.parentElement!.dataset.index!, 10);

    switch (target.dataset.command) {
      case 'up': {
        e.preventDefault();
        const index = getIndex();
        moveItem(index, index - 1);
        break;
      }
      case 'down': {
        e.preventDefault();
        const index = getIndex();
        moveItem(index, index + 1);
        break;
      }
      case 'toggle': {
        e.preventDefault();
        const index = getIndex();
        toggleItem(index, 'enabled');
        break;
      }
      case 'direction-toggle': {
        e.preventDefault();
        const index = getIndex();
        toggleItem(index, 'reversed');
        break;
      }
      default:
        break;
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided) => (
          <div
            className={styles.editor}
            ref={provided.innerRef}
            onClick={onClick}
            {...provided.droppableProps}
          >
            <SortEditorItemList order={order} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

function SortEditorItem(props: { index: number; item: SortProperty }) {
  const { index, item } = props;

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          className={clsx(styles.item, {
            [styles.dragging]: snapshot.isDragging,
            disabled: !item.enabled,
          })}
          data-index={index}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <span {...provided.dragHandleProps} tabIndex={-1}>
            <AppIcon icon={dragHandleIcon} className={styles.grip} />
          </span>
          <button
            type="button"
            role="checkbox"
            aria-checked={item.enabled}
            className={clsx(styles.button, 'sort-toggle')}
            data-command="toggle"
          >
            <AppIcon icon={item.enabled ? faCheckSquare : faSquare} />
          </button>
          <span className={styles.name} {...provided.dragHandleProps}>
            {item.displayName}
          </span>
          <button type="button" className={clsx(styles.button, 'sort-up')} data-command="up">
            <AppIcon icon={moveUpIcon} />
          </button>
          <button type="button" className={clsx(styles.button, 'sort-down')} data-command="up">
            <AppIcon icon={moveDownIcon} />
          </button>
          <button
            type="button"
            title={t('Settings.ReverseSort')}
            className={clsx(styles.button, 'direction-toggle')}
            data-command="direction-toggle"
          >
            <AppIcon
              icon={item.reversed ? maximizeIcon : minimizeIcon}
              className={
                item.enabled ? (item.reversed ? 'sort-reverse' : 'sort-forward') : undefined
              }
            />
          </button>
        </div>
      )}
    </Draggable>
  );
}
