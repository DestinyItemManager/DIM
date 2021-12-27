import clsx from 'clsx';
import _ from 'lodash';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './PressTip.m.scss';
import { SheetContext } from './Sheet';
import { usePopper } from './usePopper';

interface Props {
  /**
   * The tooltip may be provided directly, or as a function which will defer
   * constructing the tree until the tooltip is shown.
   */
  tooltip: React.ReactNode | (() => React.ReactNode);
  /**
   * The children of this component define the content that will trigger the tooltip.
   */
  children?: React.ReactNode;
  /** By default everything gets wrapped in a div, but you can choose a different element type here. */
  elementType?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
}

type ControlProps = Props &
  React.HTMLAttributes<HTMLDivElement> & {
    open: boolean;
    triggerRef: React.RefObject<HTMLDivElement>;
  };

/**
 * <PressTip.Control /> can be used to have a controlled version of the PressTip
 *
 * Example:
 *
 * const ref = useRef<HTMLDivElement>(null);
 * <PressTip.Control
 *   open={true}
 *   triggerRef={ref}
 *   tooltip={() => (
 *     <span>
 *       PressTip Content
 *     </span>
 *   )}>
 *   PressTip context element
 * </PressTip.Control>
 */
function Control({
  tooltip,
  open,
  triggerRef,
  children,
  elementType: Component = 'div',
  className,
  ...rest
}: ControlProps) {
  const tooltipContents = useRef<HTMLDivElement>(null);
  const sheetContext = useContext(SheetContext);

  usePopper({
    contents: tooltipContents,
    reference: triggerRef,
    arrowClassName: styles.arrow,
    placement: 'top',
  });

  if (!tooltip) {
    const { style } = rest;
    return (
      <Component className={className} style={style}>
        {children}
      </Component>
    );
  }

  // TODO: if we reuse a stable tooltip container instance we could animate between them
  // TODO: or use framer motion layout animations?
  return (
    <Component ref={triggerRef} className={clsx(styles.control, className)} {...rest}>
      {children}
      {open &&
        ReactDOM.createPortal(
          <div className={styles.tooltip} ref={tooltipContents}>
            <div className={styles.content}>{_.isFunction(tooltip) ? tooltip() : tooltip}</div>
            <div className={styles.arrow} />
          </div>,
          sheetContext?.current || document.body
        )}
    </Component>
  );
}

const isTouch = 'ontouchstart' in window;
const hoverDelay = isTouch ? 300 : 100;

/**
 * A "press tip" is a tooltip that can be shown by pressing on an element, or via hover.
 *
 * Tooltop content can be any React element, and can be updated through React.
 *
 * Short taps on the element will fire a click event rather than showing the element.
 *
 * <PressTip /> wraps <PressTip.Control /> to give you a simpler API for rendering a basic tooltip.
 *
 * Example:
 *
 * <PressTip
 *   tooltip={() => (
 *     <span>
 *       PressTip Content
 *     </span>
 *   )}>
 *   PressTip context element
 * </PressTip>
 */
function PressTip(props: Props) {
  const timer = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<boolean>(false);

  const closeToolTip = useCallback(() => {
    setOpen(false);
    clearTimeout(timer.current);
    timer.current = 0;
  }, []);

  const hover = useCallback((e: React.MouseEvent | React.TouchEvent | TouchEvent) => {
    e.preventDefault();
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setOpen(true);
    }, hoverDelay);
    touchStartTime.current = performance.now();
  }, []);

  // Stop the hover timer when the component unmounts
  useEffect(() => () => clearTimeout(timer.current), []);

  // Prevent clicks if the tooltip has been pressed long enough to show a tip
  const absorbClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (timer.current && performance.now() - touchStartTime.current > hoverDelay) {
      e.stopPropagation();
    }
  }, []);

  // A combination of React's global event handling strategy and a Safari bug in touch handling
  // means that relying on binding onTouchStart directly will fail to fire touchstart if this
  // element has been scrolled within a position: fixed element - like we frequently do in Sheets.
  useEffect(() => {
    // It's important that this be a passive event handler
    if (isTouch && ref.current) {
      const triggerElement = ref.current;
      triggerElement.addEventListener('touchstart', hover, { passive: true });
      return () => triggerElement.removeEventListener('touchstart', hover);
    }
  }, [hover]);

  const events = isTouch
    ? {
        // onTouchStart is handled specially above
        onTouchEnd: closeToolTip,
        onTouchCancel: closeToolTip,
        onClick: absorbClick,
      }
    : {
        onMouseEnter: hover,
        onMouseUp: closeToolTip,
        onMouseLeave: closeToolTip,
      };

  return <Control open={open} triggerRef={ref} {...events} {...props} />;
}

export default PressTip;
