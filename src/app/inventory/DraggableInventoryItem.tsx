import { CompareService } from 'app/compare/compare.service';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { loadoutDialogOpen } from 'app/loadout/LoadoutDrawer';
import { showMobileInspect } from 'app/mobile-inspect/mobile-inspect';
import { Inspect } from 'app/mobile-inspect/MobileInspect';
import clsx from 'clsx';
import React, { useRef, useState } from 'react';
import { ConnectDragSource, DragSource, DragSourceConnector, DragSourceSpec } from 'react-dnd';
import { BehaviorSubject } from 'rxjs';
import store from '../store/store';
import { stackableDrag } from './actions';
import { showDragGhost } from './drag-ghost-item';
import { DimItem } from './item-types';

interface ExternalProps {
  item: DimItem;
  inspect?: Inspect;
  isPhonePortrait?: boolean;
  children?: React.ReactNode;
}

interface InternalProps {
  connectDragSource: ConnectDragSource;
}

type Props = InternalProps & ExternalProps;

export const mobileDragType = 'mobile-drag';

function dragType(props: ExternalProps): string {
  const item = props.item;
  if ($featureFlags.mobileInspect && props.isPhonePortrait) {
    return mobileDragType;
  }
  return item.notransfer ? `${item.owner}-${item.bucket.type}` : item.bucket.type!;
}

export interface DragObject {
  item: DimItem;
}

export const isDragging$ = new BehaviorSubject(false);
export let isDragging = false;

const LONGPRESS_TIMEOUT = 200;

let dragTimeout: number | null = null;

const dragSpec: DragSourceSpec<Props, DragObject> = {
  beginDrag(props) {
    hideItemPopup();

    if (props.item.maxStackSize > 1 && props.item.amount > 1 && !props.item.uniqueStack) {
      store.dispatch(stackableDrag(true));
    }

    dragTimeout = requestAnimationFrame(() => {
      dragTimeout = null;
      document.body.classList.add('drag-perf-show');
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

function DraggableInventoryItem({
  connectDragSource,
  inspect,
  isPhonePortrait,
  children,
  item,
}: Props) {
  const [touchActive, setTouchActive] = useState(false);
  const longPressed = useRef<boolean>(false);
  const timer = useRef<number>(0);

  const resetTouch = () => {
    setTouchActive(false);
    showMobileInspect(undefined);
    showDragGhost(undefined);
    window.clearTimeout(timer.current);
    longPressed.current = false;
  };

  const onTouch = (e: React.TouchEvent) => {
    setTouchActive(e.type === 'touchstart');

    if (!inspect || loadoutDialogOpen || CompareService.dialogOpen) {
      return;
    }

    // It a longpress happend and the touch move event files, do nothing.
    if (longPressed.current && e.type === 'touchmove') {
      if ($featureFlags.mobileInspect && isPhonePortrait) {
        return;
      }
      showDragGhost({
        item,
        transform: `translate(${e.touches[0].clientX}px, ${e.touches[0].clientY}px)`,
      });
      return;
    }

    // Always reset the touch event before any other event fires.
    // Useful because if the start event happens twice before another type (it happens.)
    resetTouch();

    if (e.type !== 'touchstart') {
      // Abort longpress timer if touch moved, ended, or cancelled.
      return;
    }

    // Start a timer for the longpress action
    timer.current = window.setTimeout(() => {
      longPressed.current = true;
      if ($featureFlags.mobileInspect && isPhonePortrait) {
        showMobileInspect(item, inspect);
      }
    }, LONGPRESS_TIMEOUT);
  };

  return connectDragSource(
    <div
      onTouchStart={onTouch}
      onTouchMove={onTouch}
      onTouchEnd={onTouch}
      onTouchCancel={onTouch}
      className={clsx('item-drag-container', `item-type-${item.type}`, {
        'touch-active': touchActive,
      })}
    >
      {children}
    </div>
  );
}

/**
 * DraggableInventoryItem is a wrapper component that makes its children draggable,
 * according to the rules for the given inventory item. When dropped, it passes the full item
 * as the drop result.
 */
export default DragSource(dragType, dragSpec, collect)(DraggableInventoryItem);
