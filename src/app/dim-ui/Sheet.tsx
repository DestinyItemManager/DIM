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
  clamp: true,
};

// The sheet is dismissed if it's flicked at a velocity above dismissVelocity or dragged down more than dismissAmount times the height of the sheet.
const dismissVelocity = 0.8;
const dismissAmount = 0.5;

// Disable body scroll on mobile
const mobile = /iPad|iPhone|iPod|Android/.test(navigator.userAgent);

const stopPropagation = (e) => e.stopPropagation();

/**
 * A Sheet is a UI element that comes up from the bottom of the scren, and can be dragged to dismiss.
 */
export default function Sheet({
  header,
  footer,
  children,
  sheetClassName,
  onClose: onCloseCallback,
}: Props) {
  // This component basically doesn't render - it works entirely through setSpring and useDrag.
  // As a result, our "state" is in refs.
  // Is this currently closing?
  const closing = useRef(false);
  // Should we be dragging?
  const dragging = useRef(false);

  const windowHeight = window.innerHeight;
  const headerHeight = useMemo(() => document.getElementById('header')!.clientHeight, []);
  const maxHeight = windowHeight - headerHeight - 16;

  const sheetContents = useRef<HTMLDivElement | null>(null);
  const sheetContentsRefFn = useLockSheetContents(sheetContents);

  const sheet = useRef<HTMLDivElement>(null);
  const height = () => sheet.current?.clientHeight || 0;

  /** When the sheet stops animating, if we were closing, fire the close callback. */
  const onRest = useCallback(() => {
    if (closing.current) {
      onCloseCallback();
    }
  }, [onCloseCallback]);

  /** This spring is controlled via setSpring, which doesn't trigger re-render. */
  const [springProps, setSpring] = useSpring(() => ({
    // Initially transition from offscreen to on
    from: { transform: `translateY(${windowHeight}px)` },
    to: { transform: `translateY(0px)` },
    config: spring,
    onRest,
  }));

  /**
   * Closing the sheet sets closing to true and starts an animation to close. We only fire the
   * outer callback when the animation is done.
   */
  const onClose = useCallback(
    (e?) => {
      e?.preventDefault();
      closing.current = true;
      // Animate offscreen
      setSpring({ to: { transform: `translateY(${height()}px)` } });
    },
    [setSpring]
  );

  // Handle global escape key
  useGlobalEscapeKey(onClose);

  // This handles all drag interaction. The callback is called without re-render.
  const bindDrag = useDrag(({ event, active, movement, vxvy, last, cancel }) => {
    event?.stopPropagation();

    // If we haven't enabled dragging, cancel the gesture
    if (!last && cancel && !dragging.current) {
      cancel();
    }

    // How far down should we be positioned?
    const yDelta = active ? Math.max(0, movement[1]) : 0;
    // Set immediate (no animation) if we're in a gesture, so it follows your finger precisely
    setSpring({ immediate: active, to: { transform: `translateY(${yDelta}px)` } });

    // Detect if the gesture ended with a high velocity, or with the sheet more than
    // dismissAmount percent of the way down - if so, consider it a close gesture.
    if (last && (movement[1] > (height() || 0) * dismissAmount || vxvy[1] > dismissVelocity)) {
      onClose();
    }
  });

  // Determine when to drag. Drags if the touch falls in the header, or if the contents
  // are scrolled all the way to the top.
  const dragHandle = useRef<HTMLDivElement>(null);
  const dragHandleDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      // prevent item-tag-selector dropdown from triggering drag (Safari)
      if ((e.target as HTMLElement).classList.contains('item-tag-selector')) {
        return;
      }

      if (
        dragHandle.current?.contains(e.target as Node) ||
        sheetContents.current!.scrollTop === 0
      ) {
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
      onKeyDown={stopPropagation}
      onKeyUp={stopPropagation}
      onKeyPress={stopPropagation}
      onClick={stopPropagation}
    >
      <a href="#" className="sheet-close" onClick={onClose}>
        <AppIcon icon={disabledIcon} />
      </a>

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

/**
 * Fire a callback if the escape key is pressed.
 */
function useGlobalEscapeKey(onEscapePressed: () => void) {
  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onEscapePressed();
        return false;
      }
    };
    document.body.addEventListener('keyup', onKeyUp);
    return () => document.body.removeEventListener('keyup', onKeyUp);
  }, [onEscapePressed]);
}

/**
 * Locks body scroll except for touches in the sheet contents, and adds a block-events
 * touch handler to sheeet contents.
 */
function useLockSheetContents(sheetContents: React.MutableRefObject<HTMLDivElement | null>) {
  /** Block touch/click events for the inner scrolling area if it's not at the top. */
  const blockEvents = useCallback(
    (e: TouchEvent | React.MouseEvent) => {
      if (sheetContents.current!.scrollTop !== 0) {
        e.stopPropagation();
      }
    },
    [sheetContents]
  );

  // Use a ref callback to set up the ref immediately upon render
  const sheetContentsRefFn = useCallback(
    (contents: HTMLDivElement) => {
      sheetContents.current = contents;
      if (sheetContents.current) {
        sheetContents.current.addEventListener('touchstart', blockEvents);
        if (mobile) {
          document.body.classList.add('body-scroll-lock');
          enableBodyScroll(sheetContents.current);
          disableBodyScroll(sheetContents.current);
        }
      }
    },
    [blockEvents, sheetContents]
  );

  useEffect(
    () => () => {
      if (sheetContents.current) {
        setTimeout(() => {
          document.body.classList.remove('body-scroll-lock');
        }, 0);
        sheetContents.current.removeEventListener('touchstart', blockEvents);
        if (mobile) {
          enableBodyScroll(sheetContents.current);
        }
      }
    },
    [blockEvents, sheetContents]
  );

  return sheetContentsRefFn;
}
