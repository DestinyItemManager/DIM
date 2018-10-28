import * as classNames from 'classnames';
import * as React from 'react';
import {
  ConnectDropTarget,
  DropTarget,
  DropTargetConnector,
  DropTargetMonitor,
  DropTargetSpec
} from 'react-dnd';
import { DimItem } from '../../inventory/item-types';

interface ExternalProps {
  bucketType: string;
  children?: React.ReactNode;
  onItemLocked(lockedItem: DimItem): void;
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
  return props.bucketType!;
}

// This determines the behavior of dropping on this target
const dropSpec: DropTargetSpec<Props> = {
  drop(props, monitor) {
    const item = monitor.getItem().item as DimItem;
    props.onItemLocked(item);
  },
  canDrop(props, monitor) {
    // can only drop on a matching bucket
    const item = monitor.getItem().item as DimItem;
    return item.bucket.type === props.bucketType;
  }
};

// This forwards drag and drop state into props on the component
function collect(connect: DropTargetConnector, monitor: DropTargetMonitor): InternalProps {
  return {
    // Call this function inside render()
    // to let React DnD handle the drag events:
    connectDropTarget: connect.dropTarget(),
    // You can ask the monitor about the current drag state:
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  };
}

class LoadoutBucketDropTarget extends React.Component<Props> {
  render() {
    const { connectDropTarget, children, isOver, canDrop } = this.props;

    return connectDropTarget(
      <div
        className={classNames({
          'on-drag-hover': canDrop && isOver,
          'on-drag-enter': canDrop
        })}
      >
        {children}
      </div>
    );
  }
}

export default DropTarget(dragType, dropSpec, collect)(LoadoutBucketDropTarget);
