import * as React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import classNames from 'classnames';
import './sort-order-editor.scss';

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

// We keep a local copy of props in the state partly because Angular is slow. It's faster
// to re-render locally then just ignore the "controlled" update if it doesn't change anything.
interface State {
  order: SortProperty[];
}

/**
 * An editor for sort-orders, with drag and drop.
 *
 * This is a "controlled component" - it fires an event when the order changes, and
 * must then be given back the new order by its parent.
 */
export default class SortOrderEditor extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      order: props.order
    };
  }

  shouldComponentUpdate(_nextProp: Props, nextState: State) {
    // The order should be immutable - if the controlling component mutates it all bets are off
    return nextState.order !== this.state.order;
  }

  componentWillReceiveProps(props: Props) {
    // Copy props into state
    this.setState({
      order: props.order
    });
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
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <div className="sort-order-editor" ref={provided.innerRef} onClick={this.onClick}>
              <SortEditorItemList order={this.state.order} />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }

  private moveItem(oldIndex, newIndex, fromDrag = false) {
    newIndex = Math.min(this.state.order.length, Math.max(newIndex, 0));
    const order = reorder(this.state.order, oldIndex, newIndex);
    if (fromDrag) {
      order[newIndex] = {
        ...order[newIndex],
        enabled: newIndex === 0 || order[newIndex - 1].enabled
      };
    }
    this.fireOrderChanged(order);
  }

  private toggleItem(index) {
    const order = Array.from(this.state.order);
    order[index] = { ...order[index], enabled: !order[index].enabled };
    this.fireOrderChanged(order);
  }

  private fireOrderChanged(order: SortProperty[]) {
    this.setState({
      order
    });
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
          <i className="fa fa-bars" {...provided.dragHandleProps} />
          <span className="name" {...provided.dragHandleProps}>
            {item.displayName}
          </span>
          <i className="sort-button sort-up fa fa-chevron-up" />
          <i className="sort-button sort-down fa fa-chevron-down" />
          <i
            className={classNames(
              'sort-button',
              'sort-toggle',
              'fa',
              item.enabled ? 'fa-check-circle-o' : 'fa-circle-o'
            )}
          />
        </div>
      )}
    </Draggable>
  );
}
