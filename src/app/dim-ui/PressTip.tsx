import _ from 'lodash';
import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './PressTip.m.scss';
import { SheetContext } from './Sheet';
import { usePopper } from './usePopper';

interface Props {
  tooltip: React.ReactNode;
  children?: React.ReactNode;
  allowClickThrough?: boolean;
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
    const { className, style } = rest;
    return (
      <Component className={className} style={style}>
        {children}
      </Component>
    );
  }

  // TODO: if we reuse a stable tooltip container instance we could animate between them
  return (
    <Component ref={triggerRef} {...rest}>
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

/**
 * A "press tip" is a tooltip that can be shown by pressing on an element, or via hover.
 *
 * Tooltop content can be any React element, and can be updated through React.
 *
 * PressTip stops event propagation, so mobile can hold down on an element in lieu of hovering.
 * `allowClickThrough` property suppresses this and lets click events propagate.
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
function PressTip({ allowClickThrough, ...rest }: Props) {
  const timer = useRef<number>(0);
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<boolean>(false);

  const closeToolTip = (e: React.MouseEvent | React.TouchEvent) => {
    allowClickThrough || e.preventDefault();
    allowClickThrough || e.stopPropagation();
    setOpen(false);
    clearTimeout(timer.current);
  };

  const hover = () => {
    timer.current = window.setTimeout(() => {
      setOpen(true);
    }, 100);
  };

  const press = (e: React.MouseEvent | React.TouchEvent) => {
    allowClickThrough || e.preventDefault();
    allowClickThrough || e.stopPropagation();
    setOpen(true);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Control
      open={open}
      triggerRef={ref}
      onMouseEnter={hover}
      onMouseDown={press}
      onTouchStart={press}
      onMouseUp={closeToolTip}
      onMouseLeave={closeToolTip}
      onTouchEnd={closeToolTip}
      {...rest}
    />
  );
}

PressTip.Control = Control;

export default PressTip;
