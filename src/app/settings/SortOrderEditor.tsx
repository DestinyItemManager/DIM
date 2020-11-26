import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import {
  AppIcon,
  dragHandleIcon,
  enabledIcon,
  moveDownIcon,
  moveUpIcon,
  unselectedCheckIcon,
} from '../shell/icons';
import './SortOrderEditor.scss';

export interface SortProperty {
  readonly id: string;
  readonly displayName: string;
  readonly enabled: boolean;
  // TODO, should we support up/down?
}

const SortEditorItemList = React.memo(({ order }: { order: SortProperty[] }) => (
  <>
    {order.map((item, index) => (
      <SortEditorItem key={item.id} item={item} index={index} />
    ))}
  </>
));

interface Props {
  order: SortProperty[];
  onSortOrderChanged(order: SortProperty[]): void;
}

/**
 * An editor for sort-orders, with drag and drop.
 *
 * This is a "controlled component" - it fires an event when the order changes, and
 * must then be given back the new order by its parent.
 */
export default class SortOrderEditor extends React.Component<Props> {
  onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    this.moveItem(result.source.index, result.destination.index, true);
  };

  onClick = (e) => {
    const target: HTMLElement = e.target;
    const getIndex = () => parseInt(target.parentElement!.dataset.index!, 10);

    if (target.classList.contains('sort-up')) {
      e.preventDefault();
      const index = getIndex();
      this.moveItem(index, index - 1);
    } else if (target.classList.contains('sort-down')) {
      e.preventDefault();
      const index = getIndex();
      this.moveItem(index, index + 1);
    } else if (target.classList.contains('sort-toggle')) {
      e.preventDefault();
      const index = getIndex();
      this.toggleItem(index);
    }
  };

  render() {
    const { order } = this.props;
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <div
              className="sort-order-editor"
              ref={provided.innerRef}
              onClick={this.onClick}
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

  private moveItem(oldIndex, newIndex, fromDrag = false) {
    newIndex = _.clamp(newIndex, 0, this.props.order.length);
    const order = reorder(this.props.order, oldIndex, newIndex);
    if (fromDrag) {
      order[newIndex] = {
        ...order[newIndex],
        enabled: newIndex === 0 || order[newIndex - 1].enabled,
      };
    }
    this.fireOrderChanged(order);
  }

  private toggleItem(index) {
    const order = Array.from(this.props.order);
    order[index] = { ...order[index], enabled: !order[index].enabled };
    this.fireOrderChanged(order);
  }

  private fireOrderChanged(order: SortProperty[]) {
    this.props.onSortOrderChanged(order);
  }
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
        </div>
      )}
    </Draggable>
  );
}
