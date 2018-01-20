import * as React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import classNames from 'classnames';
import './sort-order-editor.scss';

interface SortProperty {
  id: string;
  displayName: string;
}

interface Props {
  initialItems: SortProperty[];
  onSortOrderChanged(ids: string[]): void;
}

interface State {
  items: SortProperty[];
}

// An editor for sort-orders, with drag and drop
export default class SortOrderEditor extends React.Component<Props, State> {

  constructor(props) {
    super(props);

    this.state = {
      items: [{
        id: 'foo',
        displayName: 'Foo'
      }, {
        id: 'bar',
        displayName: 'Bar'
      }, {
        id: 'baz',
        displayName: 'Baz'
      }]
    };
  }

  onDragStart = () => {
    // good times
    if (window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }
  }

  onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = reorder(
      this.state.items,
      result.source.index,
      result.destination.index
    );

    this.setState({
      items,
    });

    this.props.onSortOrderChanged(items.map((i) => i.id));
  }

  render() {
    // TODO: There can only be one DragDropContext, wrap the whole app in it?
    return (
      <DragDropContext onDragEnd={this.onDragEnd} onDragStart={this.onDragStart}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <div
              className="sort-order-editor"
              ref={provided.innerRef}
            >
              {this.state.items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div>
                      <div
                        className={classNames('sort-order-editor-item', { 'is-dragging': snapshot.isDragging })}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <i className="fa fa-bars" {...provided.dragHandleProps}/>
                        <span className="name">{item.displayName}</span>
                        <i className="sort-button fa fa-chevron-up"/>
                        <i className="sort-button fa fa-chevron-down"/>
                        <i className="sort-button fa fa-times-circle-o"/>
                      </div>
                        {provided.placeholder}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

// a little function to help us with reordering the result
function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}
