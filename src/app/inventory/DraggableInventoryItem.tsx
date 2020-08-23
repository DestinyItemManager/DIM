import React from 'react';
import { DragSourceSpec, DragSourceConnector, ConnectDragSource, DragSource } from 'react-dnd';
import { DimItem } from './item-types';
import { stackableDrag } from './actions';
import store from '../store/store';
import { BehaviorSubject } from 'rxjs';
import { settingsSelector } from 'app/settings/reducer';
import clsx from 'clsx';

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
  return item.notransfer ? `${item.owner}-${item.bucket.type}` : item.bucket.type!;
}

export interface DragObject {
  item: DimItem;
}

export const isDragging$ = new BehaviorSubject(false);
export let isDragging = false;

let dragTimeout: number | null = null;

const dragSpec: DragSourceSpec<Props, DragObject> = {
  beginDrag(props) {
    if (props.item.maxStackSize > 1 && props.item.amount > 1 && !props.item.uniqueStack) {
      store.dispatch(stackableDrag(true));
    }

    dragTimeout = requestAnimationFrame(() => {
      dragTimeout = null;
      // The colorblind filters interact badly with this
      const color = settingsSelector(store.getState()).colorA11y;
      if (!color || color === '-') {
        document.body.classList.add('drag-perf-show');
      }
    });

    isDragging = true;
    isDragging$.next(true);
    return { item: props.item };
  },

  endDrag(props) {
    if (dragTimeout !== null) {
      cancelAnimationFrame(dragTimeout);
    }

    if (props.item.maxStackSize > 1 && props.item.amount > 1 && !props.item.uniqueStack) {
      store.dispatch(stackableDrag(false));
    }

    document.body.classList.remove('drag-perf-show');

    isDragging = false;
    isDragging$.next(false);
  },

  canDrag(props): boolean {
    const item = props.item;
    return (!item.location.inPostmaster || item.destinyVersion === 2) && item.notransfer
      ? item.equipment
      : item.equipment || item.bucket.hasTransferDestination;
  },
};

function collect(connect: DragSourceConnector): InternalProps {
  return {
    // Call this function inside render()
    // to let React DnD handle the drag events:
    connectDragSource: connect.dragSource(),
    // TODO: The monitor param has interesting things for doing animation
  };
}

function DraggableInventoryItem({ connectDragSource, children, item }: Props) {
  return connectDragSource(
    <div className={clsx('item-drag-container', `item-type-${item.type}`)}>{children}</div>
  );
}

/**
 * DraggableInventoryItem is a wrapper component that makes its children draggable,
 * according to the rules for the given inventory item. When dropped, it passes the full item
 * as the drop result.
 */
export default DragSource(dragType, dragSpec, collect)(DraggableInventoryItem);
