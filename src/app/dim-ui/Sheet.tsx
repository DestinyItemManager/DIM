import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import clsx from 'clsx';
import _ from 'lodash';
import React, {
  createContext,
  forwardRef,
  MutableRefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { animated, config, SpringConfig, useSpring } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import { AppIcon, disabledIcon } from '../shell/icons';
import styles from './Sheet.m.scss';
import './Sheet.scss';

export const SheetContext = createContext<MutableRefObject<HTMLDivElement | null> | null>(null);

/**
 * The contents of the header, footer, and body can be regular elements, or a function that
 * takes an "onClose" function that can be used to close the sheet. Using onClose to close
 * the sheet ensures that it will animate away rather than simply disappearing.
 */
type SheetContent = React.ReactNode | ((args: { onClose(): void }) => React.ReactNode);

interface Props {
  header?: SheetContent;
  footer?: SheetContent;
  children?: SheetContent;
  /** Disable the sheet (no clicking, dragging, or close-on-esc). Use when another sheet is shown on top. */
  // TODO: it sorta works to do this manually, but it'd be better if we used Context to back-propagate information to "parent"
  // sheets when "child" sheets are shown. We probably still need this since there are "global" sheets like item picker.
  disabled?: boolean;
  /** Override the z-index of the sheet. Useful when stacking sheets on top of other sheets or on top of the item popup. */
  zIndex?: number;
  minHeight?: number;
  /** A custom class name to add to the sheet container. */
  sheetClassName?: string;
  /** If set, the sheet will always be whatever height it was when first rendered, even if the contents change size. */
  freezeInitialHeight?: boolean;
  onClose(): void;
}

const spring: SpringConfig = {
  ...config.stiff,
  clamp: true,
};

// The sheet is dismissed if it's flicked at a velocity above dismissVelocity,
// or dragged down more than dismissAmount times the height of the sheet.
const dismissVelocity = 0.8;
const dismissAmount = 0.5;

// Disable body scroll on mobile
const mobile = /iPad|iPhone|iPod|Android/.test(navigator.userAgent);

const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

/**
 * A Sheet is a UI element that comes up from the bottom of the screen,
 * and can be dragged downward to dismiss
 */
export default forwardRef<HTMLDivElement, Props>(function Sheet(
  {
    header,
    footer,
    children,
    sheetClassName,
    disabled,
    zIndex,
    minHeight,
    freezeInitialHeight,
    onClose,
  },
  ref
) {
  // This component basically doesn't render - it works entirely through setSpring and useDrag.
  // As a result, our "state" is in refs.
  // Is this currently closing?
  const closing = useRef(false);
  // Should we be dragging?
  const dragging = useRef(false);
  const [frozenHeight, setFrozenHeight] = useState<number | undefined>(undefined);

  const sheetContents = useRef<HTMLDivElement | null>(null);
  const sheetContentsRefFn = useLockSheetContents(sheetContents);

  useEffect(() => {
    if (freezeInitialHeight && sheetContents.current && !frozenHeight) {
      if (sheetContents.current.clientHeight > 0) {
        setFrozenHeight(sheetContents.current.clientHeight);
      } else {
        setTimeout(() => {
          sheetContents.current && setFrozenHeight(sheetContents.current.clientHeight);
        }, 500);
      }
    }
  }, [freezeInitialHeight, frozenHeight]);

  const sheet = useRef<HTMLDivElement>(null);
  const height = () => sheet.current?.clientHeight || 0;

  /** When the sheet stops animating, if we were closing, fire the close callback. */
  const onRest = useCallback(() => {
    if (closing.current) {
      onClose();
    }
  }, [onClose]);

  /** This spring is controlled via setSpring, which doesn't trigger re-render. */
  const [springProps, setSpring] = useSpring(() => ({
    // Initially transition from offscreen to on
    from: { transform: `translateY(${window.innerHeight}px)` },
    to: { transform: `translateY(0px)` },
    config: spring,
    onRest,
  }));

  /**
   * Closing the sheet sets closing to true and starts an animation to close. We only fire the
   * outer callback when the animation is done.
   */
  const handleClose = useCallback(
    (e?) => {
      if (disabled) {
        return;
      }
      e?.preventDefault();
      closing.current = true;
      // Animate offscreen
      setSpring({ to: { transform: `translateY(${height()}px)` } });
    },
    [setSpring, disabled]
  );

  // Handle global escape key
  useGlobalEscapeKey(handleClose);

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
      handleClose();
    }
  });

  // Determine when to drag. Drags if the touch falls in the header, or if the contents
  // are scrolled all the way to the top.
  const dragHandle = useRef<HTMLDivElement>(null);
  const dragHandleDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      // prevent item-tag-selector dropdown from triggering drag (Safari)
      if (isInside(e.target as HTMLElement, 'item-tag-selector')) {
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
    <SheetContext.Provider value={sheet}>
      <animated.div
        {...bindDrag()}
        style={{ ...springProps, touchAction: 'none', zIndex }}
        className={clsx('sheet', sheetClassName, { [styles.sheetDisabled]: disabled })}
        ref={sheet}
        role="dialog"
        aria-modal="false"
        onKeyDown={stopPropagation}
        onKeyUp={stopPropagation}
        onKeyPress={stopPropagation}
      >
        <a
          href="#"
          className={clsx('sheet-close', { 'sheet-no-header': !header })}
          onClick={handleClose}
        >
          <AppIcon icon={disabledIcon} />
        </a>

        <div
          ref={ref}
          style={{ minHeight }}
          className="sheet-container"
          onMouseDown={dragHandleDown}
          onMouseUp={dragHandleUp}
          onTouchStart={dragHandleDown}
          onTouchEnd={dragHandleUp}
        >
          {header && (
            <div className="sheet-header" ref={dragHandle}>
              {_.isFunction(header) ? header({ onClose: handleClose }) : header}
            </div>
          )}

          <div
            className={clsx('sheet-contents', {
              'sheet-has-footer': footer,
            })}
            style={frozenHeight ? { flexBasis: frozenHeight } : undefined}
            ref={sheetContentsRefFn}
          >
            {_.isFunction(children) ? children({ onClose: handleClose }) : children}
          </div>

          {footer && (
            <div className="sheet-footer">
              {_.isFunction(footer) ? footer({ onClose: handleClose }) : footer}
            </div>
          )}
        </div>
        <div className={styles.disabledScreen} />
      </animated.div>
    </SheetContext.Provider>
  );
});

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
 * touch handler to sheet contents.
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

  useLayoutEffect(
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

function isInside(element: HTMLElement, className: string) {
  while (element?.classList) {
    if (element.classList.contains(className)) {
      return true;
    }
    element = element.parentNode as HTMLElement;
  }
  return false;
}
