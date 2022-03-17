import { t } from 'app/i18next-t';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import {
  AppIcon,
  dragHandleIcon,
  enabledIcon,
  maximizeIcon,
  minimizeIcon,
  moveDownIcon,
  moveUpIcon,
  unselectedCheckIcon,
} from '../shell/icons';
import './SortOrderEditor.scss';

export interface SortProperty {
  readonly id: string;
  readonly displayName: string;
  readonly enabled: boolean;
  readonly reversed: boolean;
}

const SortEditorItemList = React.memo(({ order }: { order: SortProperty[] }) => (
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
  onSortOrderChanged(order: SortProperty[]): void;
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

    if (target.classList.contains('sort-up')) {
      e.preventDefault();
      const index = getIndex();
      moveItem(index, index - 1);
    } else if (target.classList.contains('sort-down')) {
      e.preventDefault();
      const index = getIndex();
      moveItem(index, index + 1);
    } else if (target.classList.contains('sort-toggle')) {
      e.preventDefault();
      const index = getIndex();
      toggleItem(index, 'enabled');
    } else if (target.classList.contains('direction-toggle')) {
      e.preventDefault();
      const index = getIndex();
      toggleItem(index, 'reversed');
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided) => (
          <div
            className="sort-order-editor"
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

// a little function to help us with reordering the result
function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}

function SortEditorItem(props: { index: number; item: SortProperty }) {
  const { index, item } = props;

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          className={clsx('sort-order-editor-item', {
            'is-dragging': snapshot.isDragging,
            disabled: !item.enabled,
          })}
          data-index={index}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <span {...provided.dragHandleProps}>
            <AppIcon icon={dragHandleIcon} className="reorder-handle" />
          </span>
          <span className="name" {...provided.dragHandleProps}>
            {item.displayName}
          </span>
          <span className="sort-button sort-up">
            <AppIcon icon={moveUpIcon} />
          </span>
          <span className="sort-button sort-down">
            <AppIcon icon={moveDownIcon} />
          </span>
          <span className="sort-button sort-toggle">
            <AppIcon icon={item.enabled ? enabledIcon : unselectedCheckIcon} />
          </span>
          <span title={t('Settings.ReverseSort')} className="sort-button direction-toggle">
            <AppIcon
              icon={item.reversed ? maximizeIcon : minimizeIcon}
              className={
                item.enabled ? (item.reversed ? 'sort-reverse' : 'sort-forward') : undefined
              }
            />
          </span>
        </div>
      )}
    </Draggable>
  );
}
