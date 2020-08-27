import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { popperGenerator, Instance, Options, Padding } from '@popperjs/core/lib/popper-lite';
import flip from '@popperjs/core/lib/modifiers/flip';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';
import applyStyles from '@popperjs/core/lib/modifiers/applyStyles';
import computeStyles from '@popperjs/core/lib/modifiers/computeStyles';
import popperOffsets from '@popperjs/core/lib/modifiers/popperOffsets';
import offset from '@popperjs/core/lib/modifiers/offset';
import arrow from '@popperjs/core/lib/modifiers/arrow';
import styles from './PressTip.m.scss';
import _ from 'lodash';

interface Props {
  tooltip: React.ReactNode;
  children: React.ReactElement<any, any>;
  allowClickThrough?: boolean;
  /** By default everything gets wrapped in a div, but you can choose a different element type here. */
  elementType?: React.ReactType;
}

/** Makes a custom popper that doesn't have the event listeners modifier */
const createPopper = popperGenerator({
  defaultModifiers: [
    popperOffsets,
    offset,
    computeStyles,
    applyStyles,
    flip,
    preventOverflow,
    arrow,
  ],
});

const popperOptions = (): Partial<Options> => {
  const headerHeight = document.getElementById('header')!.clientHeight;
  const padding: Padding = {
    left: 0,
    top: headerHeight + 5,
    right: 0,
    bottom: 0,
  };

  return {
    placement: 'top',
    modifiers: [
      {
        name: 'preventOverflow',
        options: {
          priority: ['bottom', 'top', 'right', 'left'],
          boundariesElement: 'viewport',
          padding,
        },
      },
      {
        name: 'flip',
        options: {
          behavior: ['top', 'bottom', 'right', 'left'],
          boundariesElement: 'viewport',
          padding,
        },
      },
      {
        name: 'offset',
        options: {
          offset: [0, 5],
        },
      },
      {
        name: 'arrow',
        options: {
          element: '.' + styles.arrow,
        },
      },
    ],
  };
};

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
  const popper = useRef<Instance | undefined>();
  const tooltipContents = useRef<HTMLDivElement>(null);

  const destroy = () => {
    if (popper.current) {
      popper.current.destroy();
      popper.current = undefined;
    }
  };

  useEffect(() => {
    // Reposition the popup as it is shown or if its size changes
    if (!open) {
      return destroy();
    }

    if (!tooltipContents.current || !triggerRef.current) {
      return;
    } else {
      if (popper.current) {
        popper.current.update();
      } else {
        const options = popperOptions();

        popper.current = createPopper(triggerRef.current, tooltipContents.current, options);
        popper.current.update();
        setTimeout(() => popper.current?.update(), 0); // helps fix arrow position
      }
    }

    return () => {
      destroy();
    };
  }, [open, triggerRef]);

  if (!tooltip) {
    return <div>{children}</div>;
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
          document.body
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

  const closeToolTip = (e) => {
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

  const press = (e) => {
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
