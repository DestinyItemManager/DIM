import { Placement } from '@popperjs/core';
import { tempContainer } from 'app/utils/temp-container';
import clsx from 'clsx';
import _ from 'lodash';
import {
  MutableRefObject,
  default as React,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import styles from './PressTip.m.scss';
import { usePopper } from './usePopper';

/**
 * The element where the PressTip should be added to. By default it's the body,
 * but other elements (like Sheet) can use this to override the attachment point
 * for PressTips below them in the tree.
 */
export const PressTipRoot = createContext<MutableRefObject<HTMLElement | null>>({
  current: null,
});

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
  /** Allow the tooltip to be wider than the normal size */
  wide?: boolean;
  /** Reduce padding around the tooltip content. This is appropriate for single-line strings. */
  minimal?: boolean;
  style?: React.CSSProperties;
  placement?: Placement;
}

type ControlProps = Props &
  React.HTMLAttributes<HTMLDivElement> & {
    open: boolean;
    triggerRef: React.RefObject<HTMLDivElement>;
  };

interface TooltipCustomization {
  header?: React.ReactNode;
  subheader?: React.ReactNode;
  className?: string | null;
}
const TooltipContext = createContext<React.Dispatch<
  React.SetStateAction<TooltipCustomization>
> | null>(null);

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
  placement,
  wide,
  minimal,
  ...rest
}: ControlProps) {
  const tooltipContents = useRef<HTMLDivElement>(null);
  const pressTipRoot = useContext(PressTipRoot);
  const [customization, customizeTooltip] = useState<TooltipCustomization>({ className: null });

  usePopper({
    contents: tooltipContents,
    reference: triggerRef,
    arrowClassName: styles.arrow,
    placement,
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
          <div
            className={clsx(styles.tooltip, customization.className, {
              [styles.wideTooltip]: wide,
              [styles.minimalTooltip]: minimal,
            })}
            ref={tooltipContents}
          >
            {Boolean(customization.header) && (
              <div className={styles.header}>
                <h2>{customization.header}</h2>
                {Boolean(customization.subheader) && <h3>{customization.subheader}</h3>}
              </div>
            )}
            <div className={styles.content}>
              <TooltipContext.Provider value={customizeTooltip}>
                {_.isFunction(tooltip) ? tooltip() : tooltip}
              </TooltipContext.Provider>
            </div>
            <div className={styles.arrow} />
          </div>,
          pressTipRoot.current || tempContainer
        )}
    </Component>
  );
}

/**
 * This hook allows customization of the tooltip that the calling component is currently hosted within.
 * It has no effect if the calling component is not hosted within a tooltip.
 *
 * @returns Whether the calling component is currently being hosted in a tooltip.
 */
export function useTooltipCustomization({
  getHeader,
  getSubheader,
  className,
}: {
  /**
   * A function that returns the content to be rendered in the tooltip's header (bold uppercase text). This
   * **MUST** be memoized (e.g. wrapped in `useCallback`) to prevent an infinite loop.
   */
  getHeader?: () => React.ReactNode;

  /**
   * A function that returns the content to be rendered in the tooltip's subheader (dimmed text below the
   * header). This **MUST** be memoized (e.g. wrapped in `useCallback`) to prevent an infinite loop.
   */
  getSubheader?: () => React.ReactNode;

  /** The CSS class(es) to be applied to the tooltip's root element. */
  className?: string | null;
}) {
  const customizeTooltip = useContext(TooltipContext);
  useEffect(() => {
    if (customizeTooltip) {
      customizeTooltip((existing) => ({
        ...existing,
        ...(getHeader && { header: getHeader() }),
        ...(getSubheader && { subheader: getSubheader() }),
        ...(className !== undefined && { className }),
      }));
    }
  }, [customizeTooltip, getHeader, getSubheader, className]);

  return customizeTooltip !== null;
}

export const Tooltip = {
  /**
   * A convenience component used to customise the tooltip's header (bold uppercase text) from within JSX.
   * This does not render anything and has no effect if the calling component is not currently hosted within
   * a tooltip.
   *
   * If you want to display more than a single string, use the `useTooltipCustomization` hook instead.
   */
  Header: ({ text }: { text: string }) => {
    useTooltipCustomization({ getHeader: useCallback(() => text, [text]) });
    return null;
  },

  /**
   * A convenience component used to customise the tooltip's subheader (dimmed text below the header) from
   * within JSX. This does not render anything and has no effect if the calling component is not currently
   * hosted within a tooltip.
   *
   * If you want to display more than a single string, use the `useTooltipCustomization` hook instead.
   */
  Subheader: ({ text }: { text: string }) => {
    useTooltipCustomization({ getSubheader: useCallback(() => text, [text]) });
    return null;
  },

  /**
   * A convenience component used to add a CSS class to the tooltip's root component from within JSX.
   * This does not render anything and has no effect if the calling component is not currently hosted within
   * a tooltip.
   */
  Customize: ({ className }: { className: string | null }) => {
    useTooltipCustomization({ className });
    return null;
  },

  /**
   * If the calling component is hosted within a tooltip, this component wraps its children in a styled `div`.
   * If not, a fragment containing the children is returned instead.
   */
  Section: ({ children, className }: { children: React.ReactNode; className?: string }) => {
    const tooltip = useContext(TooltipContext);
    if (!tooltip) {
      return <>{children}</>;
    }
    return <div className={clsx(styles.section, className)}>{children}</div>;
  },
};

const hoverTime = 100; // ms that the cursor can be over the target before the presstip shows
const pressTime = 300; // ms that the element can be pressed before the presstip shows

/**
 * A "press tip" is a tooltip that can be shown by pressing on an element, or via hover.
 *
 * Tooltip content can be any React element, and can be updated through React.
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
export function PressTip(props: Props) {
  const timer = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const ref = useRef<HTMLDivElement>(null);
  const startEvent = useRef<'pointerdown' | 'pointerenter'>();
  const suppressClickUntil = useRef<number>(0);
  const [open, setOpen] = useState<boolean>(false);

  const closeToolTip = useCallback((e: React.PointerEvent) => {
    if (e.type === 'pointerup') {
      ref.current?.releasePointerCapture(e.pointerId);
    }
    // Ignore events that aren't paired up
    if (
      !startEvent.current ||
      (e.type === 'pointerup' && startEvent.current === 'pointerenter') ||
      (e.type === 'pointerleave' && startEvent.current === 'pointerdown')
    ) {
      return;
    }
    setOpen(false);
    // click fires after pointerup, but we want to suppress click if we'd shown the presstip
    if (
      startEvent.current === 'pointerdown' &&
      performance.now() - touchStartTime.current > pressTime
    ) {
      suppressClickUntil.current = performance.now() + 100;
    }
    clearTimeout(timer.current);
    timer.current = 0;
    startEvent.current = undefined;
  }, []);

  const hover = useCallback((e: React.PointerEvent) => {
    if (e.type === 'pointerdown') {
      // Capture pointer so our pointermove absorber works
      ref.current?.setPointerCapture(e.pointerId);
    }
    e.preventDefault();
    // If we're already hovering, don't start hovering again
    if (
      startEvent.current &&
      // Safari, at least, fires both pointerenter and pointerdown at the same time. We want the pointerdown event.
      !(startEvent.current === 'pointerenter' && performance.now() - touchStartTime.current < 10)
    ) {
      return;
    }

    clearTimeout(timer.current);
    // Save the event type that initiated the hover
    startEvent.current = e.type as 'pointerenter' | 'pointerdown';

    // Record the start timestamp of the gesture
    touchStartTime.current = performance.now();
    // Hover over should wait for a shorter delay than a press
    const hoverDelay = e.type === 'pointerenter' ? hoverTime : pressTime;
    // Start a timer to show the pressTip
    timer.current = window.setTimeout(() => {
      setOpen(true);
    }, hoverDelay);
  }, []);

  // Stop the hover timer when the component unmounts
  useEffect(() => () => clearTimeout(timer.current), []);

  // When the tooltip was opened by pressing (pointerdown), prevent the click event when
  // we end the gesture. If the presstip was opened via hovering we want to allow clicks
  // through.
  const absorbClick = useCallback((e: React.MouseEvent) => {
    if (performance.now() < suppressClickUntil.current) {
      e.stopPropagation();
    }
  }, []);

  // Prevent dragging from the long press
  const absorbMove = useCallback(
    (e: React.PointerEvent) => {
      if (open) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [open]
  );

  const events = {
    onPointerEnter: hover,
    onPointerDown: hover,
    onPointerLeave: closeToolTip,
    onPointerMove: absorbMove,
    onPointerUp: closeToolTip,
    onPointerCancel: closeToolTip,
    onClick: absorbClick,
  };

  return <Control open={open} triggerRef={ref} {...events} {...props} />;
}
