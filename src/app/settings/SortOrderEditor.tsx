import * as React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import classNames from 'classnames';
import './SortOrderEditor.scss';
import {
  reorderIcon,
  AppIcon,
  enabledIcon,
  moveUpIcon,
  moveDownIcon,
  unselectedCheckIcon
} from '../shell/icons';

export interface SortProperty {
  readonly id: string;
  readonly displayName: string;
  readonly enabled: boolean;
  // TODO, should we support up/down?
}

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
  constructor(props: Props) {
    super(props);
    this.state = {
      order: props.order
    };
  }

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
            <div className="sort-order-editor" ref={provided.innerRef} onClick={this.onClick}>
              <SortEditorItemList order={order} />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }

  private moveItem(oldIndex, newIndex, fromDrag = false) {
    newIndex = Math.min(this.props.order.length, Math.max(newIndex, 0));
    const order = reorder(this.props.order, oldIndex, newIndex);
    if (fromDrag) {
      order[newIndex] = {
        ...order[newIndex],
        enabled: newIndex === 0 || order[newIndex - 1].enabled
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

class SortEditorItemList extends React.Component<{ order: SortProperty[] }, never> {
  shouldComponentUpdate(nextProps, _nextState) {
    return nextProps.order !== this.props.order;
  }

  render() {
    return this.props.order.map((item, index) => (
      <SortEditorItem key={item.id} item={item} index={index} />
    ));
  }
}

function SortEditorItem(props: { index: number; item: SortProperty }) {
  const { index, item } = props;

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          className={classNames('sort-order-editor-item', {
            'is-dragging': snapshot.isDragging,
            disabled: !item.enabled
          })}
          data-index={index}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <span {...provided.dragHandleProps}>
            <AppIcon icon={reorderIcon} className="reorder-handle" />
          </span>
          <span className="name" {...provided.dragHandleProps}>
            {item.displayName}
          </span>
          <AppIcon icon={moveUpIcon} className="sort-button sort-up" />
          <AppIcon icon={moveDownIcon} className="sort-button sort-down" />
          <AppIcon
            icon={item.enabled ? enabledIcon : unselectedCheckIcon}
            className="sort-button sort-toggle"
          />
        </div>
      )}
    </Draggable>
  );
}
