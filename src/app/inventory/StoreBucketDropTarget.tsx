import { ThunkDispatchProp } from 'app/store/types';
import { itemCanBeEquippedByStoreId } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import {
  ConnectDropTarget,
  DropTarget,
  DropTargetConnector,
  DropTargetMonitor,
  DropTargetSpec,
} from 'react-dnd';
import { InventoryBucket } from './inventory-buckets';
import { DimItem } from './item-types';
import { dropItem } from './move-item';

interface ExternalProps extends ThunkDispatchProp {
  bucket: InventoryBucket;
  storeId: string;
  storeClassType: DestinyClass;
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
  return props.bucket.inPostmaster
    ? []
    : [props.bucket.type!, `${props.storeId}-${props.bucket.type!}`, 'postmaster'];
}

// This determines the behavior of dropping on this target
const dropSpec: DropTargetSpec<Props> = {
  drop(props, monitor, component) {
    // https://github.com/react-dnd/react-dnd-html5-backend/issues/23
    const shiftPressed = (component as StoreBucketDropTarget).shiftKeyDown;
    const item = monitor.getItem().item as DimItem;
    props.dispatch(dropItem(item, props.storeId, Boolean(props.equip), shiftPressed));
  },
  canDrop(props, monitor) {
    // You can drop anything that can be transferred into a non-equipped bucket
    if (!props.equip) {
      return true;
    }
    // But equipping has requirements
    const item = monitor.getItem().item as DimItem;
    return itemCanBeEquippedByStoreId(item, props.storeId, props.storeClassType);
  },
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
    item: item && (item.item as DimItem),
  };
}

class StoreBucketDropTarget extends React.Component<Props> {
  dragTimer?: number;
  shiftKeyDown = false;
  private element?: HTMLDivElement;

  render() {
    const { connectDropTarget, children, isOver, canDrop, equip, className, bucket } = this.props;

    // TODO: I don't like that we're managing the classes for sub-bucket here

    return connectDropTarget(
      <div
        ref={this.captureRef}
        className={clsx('sub-bucket', className, equip ? 'equipped' : 'unequipped', {
          'on-drag-hover': canDrop && isOver,
          'on-drag-enter': canDrop,
        })}
        onClick={this.onClick}
        aria-label={bucket.name}
      >
        {children}
      </div>
    );
  }

  private captureRef = (ref: HTMLDivElement) => {
    if (ref) {
      ref.addEventListener('dragover', this.onDrag);
    } else {
      this.element?.removeEventListener('dragover', this.onDrag);
    }
    this.element = ref;
  };

  private onDrag = (e: DragEvent) => {
    this.shiftKeyDown = e.shiftKey;
  };

  private onClick = () => {
    document.body.classList.remove('drag-perf-show');
  };
}

export default DropTarget(dragType, dropSpec, collect)(StoreBucketDropTarget);
