import * as React from 'react';
import {
  DropTarget,
  DropTargetSpec,
  DropTargetConnector,
  DropTargetMonitor,
  ConnectDropTarget
} from 'react-dnd';
import * as classNames from 'classnames';
import { InventoryBucket } from './inventory-buckets';
import { DimStore } from './store-types';
import { DimItem } from './item-types';
import moveDroppedItem from './move-dropped-item';

interface ExternalProps {
  bucket: InventoryBucket;
  store: DimStore;
  equip?: boolean;
  children?: React.ReactNode;
}

// These are all provided by the DropTarget HOC function
interface InternalProps {
  connectDropTarget: ConnectDropTarget;
  isOver: boolean;
  canDrop: boolean;
}

type Props = InternalProps & ExternalProps;

// This determines what types can be dropped on this target
function dragType(props: ExternalProps) {
  return [props.bucket.type!, `${props.store.id}-${props.bucket.type!}`];
}

// This determines the behavior of dropping on this target
const dropSpec: DropTargetSpec<Props> = {
  drop(props, monitor, component) {
    // TODO: ooh, monitor has interesting offset info
    // TODO: Do this all through a Redux action
    const hovering = component.state.hovering;
    const shiftPressed = false; // TODO: Figure out shift key
    const item = monitor.getItem().item as DimItem;
    moveDroppedItem(props.store, item, Boolean(props.equip), shiftPressed, hovering);
  },
  canDrop(props, monitor) {
    // You can drop anything that can be transferred into a non-equipped bucket
    if (!props.equip) {
      return true;
    }
    // But equipping has requirements
    const item = monitor.getItem().item as DimItem;
    return item.canBeEquippedBy(props.store);
  }
};

// This forwards drag and drop state into props on the component
function collect(
  connect: DropTargetConnector,
  monitor: DropTargetMonitor
): InternalProps {
  return {
    // Call this function inside render()
    // to let React DnD handle the drag events:
    connectDropTarget: connect.dropTarget(),
    // You can ask the monitor about the current drag state:
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  };
}

interface State {
  hovering: boolean;
}

// TODO: enter/leave dwell indicator stuff (with redux??)
class StoreBucketDropTarget extends React.Component<Props, State> {
  dragTimer?: number;
  state = { hovering: false };

  componentWillReceiveProps(nextProps) {
    if (!this.props.isOver && nextProps.isOver) {
      // You can use this as enter handler
      this.dragTimer = window.setTimeout(() => {
        // TODO: publish this up to the parent and then consume it via props??
        // TODO: only do this if the store isn't the origin store
        this.setState({ hovering: true });
      }, 1000);
    }

    if (this.props.isOver && !nextProps.isOver) {
      // You can use this as leave handler
      this.setState({ hovering: false });
      if (this.dragTimer) {
        window.clearTimeout(this.dragTimer);
        this.dragTimer = undefined;
      }
    }
  }

  render() {
    const { connectDropTarget, children, isOver, canDrop, equip } = this.props;

    // TODO: I don't like that we're managing the classes for sub-bucket here

    // TODO: if hovering and the item is stackable, show the dwell thing thru a portal

    return connectDropTarget(
      <div
        className={classNames('sub-bucket', equip ? 'equipped' : 'unequipped', {
          'on-drag-hover': canDrop && isOver,
          'on-drag-enter': canDrop
        })}
      >
        {children}
      </div>
    );
  }
}

export default DropTarget(dragType, dropSpec, collect)(StoreBucketDropTarget);
