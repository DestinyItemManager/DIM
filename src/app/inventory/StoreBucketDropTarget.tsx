import React from 'react';
import {
  DropTarget,
  DropTargetSpec,
  DropTargetConnector,
  DropTargetMonitor,
  ConnectDropTarget
} from 'react-dnd';
import clsx from 'clsx';
import { InventoryBucket } from './inventory-buckets';
import { DimStore } from './store-types';
import { DimItem } from './item-types';
import moveDroppedItem from './move-dropped-item';

interface ExternalProps {
  bucket: InventoryBucket;
  store: DimStore;
  equip?: boolean;
  children?: React.ReactNode;
  className?: string;
}

// These are all provided by the DropTarget HOC function
interface InternalProps {
  connectDropTarget: ConnectDropTarget;
  isOver: boolean;
  canDrop: boolean;
  item?: DimItem;
}

type Props = InternalProps & ExternalProps;

// This determines what types can be dropped on this target
function dragType(props: ExternalProps) {
  return [props.bucket.type!, `${props.store.id}-${props.bucket.type!}`];
}

// This determines the behavior of dropping on this target
const dropSpec: DropTargetSpec<Props> = {
  drop(props, monitor, component) {
    // https://github.com/react-dnd/react-dnd-html5-backend/issues/23
    const shiftPressed = (component as StoreBucketDropTarget).shiftKeyDown;
    const item = monitor.getItem().item as DimItem;
    moveDroppedItem(props.store, item, Boolean(props.equip), shiftPressed);
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
function collect(connect: DropTargetConnector, monitor: DropTargetMonitor): InternalProps {
  const item = monitor.getItem();
  return {
    // Call this function inside render()
    // to let React DnD handle the drag events:
    connectDropTarget: connect.dropTarget(),
    // You can ask the monitor about the current drag state:
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop(),
    item: item && (item.item as DimItem)
  };
}

class StoreBucketDropTarget extends React.Component<Props> {
  dragTimer?: number;
  shiftKeyDown = false;
  private element?: HTMLDivElement;

  render() {
    const { connectDropTarget, children, isOver, canDrop, equip, className } = this.props;

    // TODO: I don't like that we're managing the classes for sub-bucket here

    return connectDropTarget(
      <div
        ref={this.captureRef}
        className={clsx('sub-bucket', className, equip ? 'equipped' : 'unequipped', {
          'on-drag-hover': canDrop && isOver,
          'on-drag-enter': canDrop
        })}
      >
        {children}
      </div>
    );
  }

  private captureRef = (ref: HTMLDivElement) => {
    if (ref) {
      ref.addEventListener('dragover', this.onDrag);
    } else {
      this.element && this.element.removeEventListener('dragover', this.onDrag);
    }
    this.element = ref;
  };

  private onDrag = (e: DragEvent) => {
    this.shiftKeyDown = e.shiftKey;
  };
}

export default DropTarget(dragType, dropSpec, collect)(StoreBucketDropTarget);
