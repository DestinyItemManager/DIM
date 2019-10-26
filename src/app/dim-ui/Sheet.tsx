import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import './Sheet.scss';
import { AppIcon, disabledIcon } from '../shell/icons';
import { config, animated, useSpring } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import clsx from 'clsx';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import _ from 'lodash';

interface Props {
  header?: React.ReactNode | ((args: { onClose(): void }) => React.ReactNode);
  footer?: React.ReactNode | ((args: { onClose(): void }) => React.ReactNode);
  children?: React.ReactNode | ((args: { onClose(): void }) => React.ReactNode);
  sheetClassName?: string;
  onClose(): void;
}

const spring = {
  ...config.stiff,
  clamp: true
};

// The sheet is dismissed if it's flicked at a velocity above dismissVelocity or dragged down more than dismissAmount times the height of the sheet.
const dismissVelocity = 0.8;
const dismissAmount = 0.5;

// Disable body scroll on mobile
const mobile = /iPad|iPhone|iPod|Android/.test(navigator.userAgent);

/**
 * A Sheet is a mobile UI element that comes up from the bottom of the scren, and can be dragged to dismiss.
 */
export default function Sheet(
  this: void,
  { header, footer, children, sheetClassName, onClose: onCloseCallback }: Props
) {
  // This component basically doesn't render - it works entirely through setSpring and useDrag.
  // As a result, our "state" is in refs.
  const closing = useRef(false);
  const dragging = useRef(false);
  const sheet = useRef<HTMLDivElement>(null);
  const sheetContents = useRef<HTMLDivElement | null>(null);
  const dragHandle = useRef<HTMLDivElement>(null);

  const windowHeight = window.innerHeight;
  const headerHeight = useMemo(() => document.getElementById('header')!.clientHeight, []);
  const maxHeight = windowHeight - headerHeight - 16;

  /** Block touch/click events for the inner scrolling area if it's not at the top. */
  const blockEvents = (e: TouchEvent | React.MouseEvent) => {
    if (sheetContents.current!.scrollTop !== 0) {
      e.stopPropagation();
    }
  };
  const sheetContentsRefFn = useCallback((contents: HTMLDivElement) => {
    sheetContents.current = contents;
    if (sheetContents.current) {
      sheetContents.current.addEventListener('touchstart', blockEvents);
      if (mobile) {
        console.log('body lockin', sheetContents.current);
        enableBodyScroll(sheetContents.current);
        disableBodyScroll(sheetContents.current);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (sheetContents.current) {
        sheetContents.current.removeEventListener('touchstart', blockEvents);
        if (mobile) {
          console.log('body unlocking', sheetContents.current);
          enableBodyScroll(sheetContents.current);
        }
      }
    };
  }, []);

  const height = () => sheet.current!.clientHeight;

  const onRest = () => {
    console.log('onRest', closing);
    if (closing.current) {
      onCloseCallback();
    }
  };

  const [springProps, setSpring] = useSpring(() => ({
    from: { transform: `translateY(${windowHeight}px)` },
    to: { transform: `translateY(0px)` },
    config: spring,
    onRest
  }));

  const onClose = () => {
    console.log('Closing sheet');
    closing.current = true;
    setSpring({ to: { transform: `translateY(${height()}px)` } });
  };

  // Handle global escape key
  useGlobalEscapeKey(onClose);

  const bindDrag = useDrag(({ active, movement, vxvy, last, cancel }) => {
    if (!last && cancel && !dragging.current) {
      console.log('canceling, not dragging');
      cancel();
    }
    const yDelta = active ? Math.max(0, movement ? movement[1] : 0) : 0;

    console.log(
      'Set spring',
      { immediate: active, to: { transform: `translateY(${yDelta}px)` } },
      { active, movement, vxvy, last }
    );

    setSpring({ immediate: active, to: { transform: `translateY(${yDelta}px)` } });

    if (last) {
      if (
        (movement ? movement[1] : 0) > (height() || 0) * dismissAmount ||
        (vxvy && vxvy[1] > dismissVelocity)
      ) {
        console.log('fling closing');
        onClose();
      }
    }
  });

  const dragHandleDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      console.log('DragHandleDown');
      // prevent item-tag-selector dropdown from triggering drag (Safari)
      if ((e.target as HTMLElement).classList.contains('item-tag-selector')) {
        return;
      }

      if (
        (dragHandle.current && dragHandle.current.contains(e.target as Node)) ||
        true ||
        sheetContents.current!.scrollTop === 0
      ) {
        console.log('set dragging');
        dragging.current = true;
      }
    },
    []
  );

  const dragHandleUp = useCallback(() => (dragging.current = false), []);

  return (
    <animated.div
      {...bindDrag()}
      style={{ ...springProps, maxHeight, touchAction: 'none' }}
      className={clsx('sheet', sheetClassName)}
      ref={sheet}
      role="dialog"
      aria-modal="false"
    >
      <div className="sheet-close" onClick={onClose}>
        <AppIcon icon={disabledIcon} />
      </div>

      <div
        className="sheet-container"
        style={{ maxHeight }}
        onMouseDown={dragHandleDown}
        onMouseUp={dragHandleUp}
        onTouchStart={dragHandleDown}
        onTouchEnd={dragHandleUp}
      >
        {header && (
          <div className="sheet-header" ref={dragHandle}>
            {_.isFunction(header) ? header({ onClose }) : header}
          </div>
        )}

        <div
          className={clsx('sheet-contents', { 'sheet-has-footer': footer })}
          ref={sheetContentsRefFn}
        >
          {_.isFunction(children) ? children({ onClose }) : children}
        </div>

        {footer && (
          <div className="sheet-footer">{_.isFunction(footer) ? footer({ onClose }) : footer}</div>
        )}
      </div>
    </animated.div>
  );
}

function useGlobalEscapeKey(onEscapePressed: () => void) {
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onEscapePressed();
      return false;
    }
  };
  useEffect(() => {
    document.body.addEventListener('keyup', onKeyUp);
    return () => document.body.removeEventListener('keyup', onKeyUp);
  });
}
