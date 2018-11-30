import * as React from 'react';
import { DragSourceSpec, DragSourceConnector, ConnectDragSource, DragSource } from 'react-dnd';
import { DimItem } from './item-types';
import { stackableDrag } from './actions';
import store from '../store/store';

interface ExternalProps {
  item: DimItem;
  children?: React.ReactNode;
}

interface InternalProps {
  connectDragSource: ConnectDragSource;
}

type Props = InternalProps & ExternalProps;

function dragType(props: ExternalProps): string {
  const item = props.item;
  // TODO: let postmaster stuff be dragged anywhere?
  return item.notransfer || (item.location.inPostmaster && item.destinyVersion === 2)
    ? `${item.owner}-${item.bucket.type}`
    : item.bucket.type!;
}

export interface DragObject {
  item: DimItem;
}

export let isDragging = false;

const dragSpec: DragSourceSpec<Props, DragObject> = {
  beginDrag(props) {
    if (props.item.maxStackSize > 1 && props.item.amount > 1 && !props.item.uniqueStack) {
      store.dispatch(stackableDrag(true));
    }
    isDragging = true;
    return { item: props.item };
  },

  endDrag(props) {
    if (props.item.maxStackSize > 1 && props.item.amount > 1 && !props.item.uniqueStack) {
      store.dispatch(stackableDrag(false));
    }
    isDragging = false;
  },

  canDrag(props): boolean {
    const item = props.item;
    return (!item.location.inPostmaster || item.destinyVersion === 2) && item.notransfer
      ? item.equipment
      : item.equipment || item.bucket.hasTransferDestination;
  }
};

function collect(connect: DragSourceConnector): InternalProps {
  return {
    // Call this function inside render()
    // to let React DnD handle the drag events:
    connectDragSource: connect.dragSource()
    // TODO: The monitor param has interesting things for doing animation
  };
}

class DraggableInventoryItem extends React.Component<Props> {
  render() {
    const { connectDragSource, children } = this.props;
    return connectDragSource(<div className="item-drag-container">{children}</div>);
  }
}

/**
 * DraggableInventoryItem is a wrapper component that makes its children draggable,
 * according to the rules for the given inventory item. When dropped, it passes the full item
 * as the drop result.
 */
export default DragSource(dragType, dragSpec, collect)(DraggableInventoryItem);
