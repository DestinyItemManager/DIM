import clsx from 'clsx';
import React from 'react';
import {
  ConnectDropTarget,
  DropTarget,
  DropTargetConnector,
  DropTargetMonitor,
  DropTargetSpec,
} from 'react-dnd';
import { DimItem } from '../../inventory/item-types';

interface ExternalProps {
  className?: string;
  children?: React.ReactNode;
  onExcluded(lockedItem: DimItem): void;
}

// These are all provided by the DropTarget HOC function
interface InternalProps {
  connectDropTarget: ConnectDropTarget;
  isOver: boolean;
  canDrop: boolean;
}

type Props = InternalProps & ExternalProps;

// This determines the behavior of dropping on this target
const dropSpec: DropTargetSpec<Props> = {
  drop(props, monitor) {
    const item = monitor.getItem().item as DimItem;
    props.onExcluded(item);
  },
};

// This forwards drag and drop state into props on the component
function collect(connect: DropTargetConnector, monitor: DropTargetMonitor): InternalProps {
  return {
    // Call this function inside render()
    // to let React DnD handle the drag events:
    connectDropTarget: connect.dropTarget(),
    // You can ask the monitor about the current drag state:
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop(),
  };
}

function ExcludeItemsDropTarget({
  className,
  connectDropTarget,
  children,
  isOver,
  canDrop,
}: Props) {
  return connectDropTarget(
    <div
      className={clsx(className, {
        'on-drag-hover': canDrop && isOver,
        'on-drag-enter': canDrop,
      })}
    >
      {children}
    </div>
  );
}

export default DropTarget<ExternalProps, InternalProps>(
  ['Helmet', 'Gauntlets', 'Chest', 'Leg', 'ClassItem', 'Artifact', 'Ghost'],
  dropSpec,
  collect
)(ExcludeItemsDropTarget);
