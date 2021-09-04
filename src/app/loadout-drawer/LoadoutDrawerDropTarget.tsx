import { DragObject } from 'app/inventory/DraggableInventoryItem';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import clsx from 'clsx';
import React from 'react';
import {
  ConnectDropTarget,
  DropTarget,
  DropTargetConnector,
  DropTargetMonitor,
  DropTargetSpec,
} from 'react-dnd';
import { DimItem } from '../inventory/item-types';

interface ExternalProps {
  // eslint-disable-next-line react-redux/no-unused-prop-types
  bucketTypes: string[];
  // eslint-disable-next-line react-redux/no-unused-prop-types
  storeIds: string[];
  children?: React.ReactNode;
  // eslint-disable-next-line react-redux/no-unused-prop-types
  onDroppedItem(item: DimItem): void;
}

// These are all provided by the DropTarget HOC function
interface InternalProps {
  connectDropTarget: ConnectDropTarget;
  isOver: boolean;
}

type Props = InternalProps & ExternalProps;

// This determines what types can be dropped on this target
function dragType(props: ExternalProps) {
  return props.bucketTypes.flatMap((bucketType) =>
    props.storeIds.flatMap((storeId) => [bucketType, `${storeId}-${bucketType}`])
  );
}

// This determines the behavior of dropping on this target
const dropSpec: DropTargetSpec<Props, DragObject> = {
  drop(props, monitor) {
    const item = monitor.getItem().item;
    props.onDroppedItem(item);
  },
  canDrop(_props, monitor) {
    // But equipping has requirements
    const item = monitor.getItem().item;
    return itemCanBeInLoadout(item);
  },
};

// This forwards drag and drop state into props on the component
function collect(
  connect: DropTargetConnector,
  monitor: DropTargetMonitor<DragObject>
): InternalProps {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver() && monitor.canDrop(),
  };
}

function LoadoutDrawerDropTarget({ connectDropTarget, children, isOver }: Props) {
  return connectDropTarget(
    <div
      className={clsx('loadout-drop', {
        'on-drag-hover': isOver,
      })}
    >
      {children}
    </div>
  );
}

export default DropTarget(dragType, dropSpec, collect)(LoadoutDrawerDropTarget);
