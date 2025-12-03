import { Placement } from '@popperjs/core';
import { tempContainer } from 'app/utils/temp-container';
import clsx from 'clsx';
import React, {
  RefObject,
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import * as styles from './PressTip.m.scss';
import { usePopper } from './usePopper';

/**
 * The element where the PressTip should be added to. By default it's the body,
 * but other elements (like Sheet) can use this to override the attachment point
 * for PressTips below them in the tree.
 */
// eslint-disable-next-line @eslint-react/naming-convention/context-name
export const PressTipRoot = createContext<RefObject<HTMLElement | null>>({
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
  role?: string;
}

type ControlProps = Props &
  React.HTMLAttributes<HTMLDivElement> & {
    open: boolean;
    triggerRef: React.RefObject<HTMLDivElement | null>;
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
 * @example
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
  const pressTipRoot = use(PressTipRoot);
  const [customization, customizeTooltip] = useState<TooltipCustomization>({ className: null });

  usePopper(
    {
      contents: tooltipContents,
      reference: triggerRef,
      arrowClassName: styles.arrow,
      placement,
    },
    [open],
  );

  if (!tooltip) {
    const { style } = rest;
    return (
      <Component className={className} style={style} {...rest}>
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
        createPortal(
          <div
            className={clsx(styles.tooltip, customization.className, {
              [styles.wideTooltip]: wide,
              [styles.minimalTooltip]: minimal,
            })}
            ref={tooltipContents}
          >
            {Boolean(customization.header || customization.subheader) && (
              <div className={styles.header}>
                <h2>{customization.header}</h2>
                {Boolean(customization.subheader) && <h3>{customization.subheader}</h3>}
              </div>
            )}
            {containsContentStyle(tooltip) ? (
              tooltip
            ) : (
              <div className={styles.content}>
                <TooltipContext value={customizeTooltip}>
                  {typeof tooltip === 'function' ? tooltip() : tooltip}
                </TooltipContext>
              </div>
            )}

            <div className={styles.arrow} />
          </div>,
          pressTipRoot.current || tempContainer,
        )}
    </Component>
  );
}

/**
 * This checks to see if a tooltip already contains a "content" classname element.
 * If so we can treat it as raw input rather than wrapping it in another copy of
 * the default tooltip content wrapper.
 */
function containsContentStyle(tooltip: unknown): tooltip is React.ReactNode {
  return Boolean(
    tooltip &&
    typeof tooltip === 'object' &&
    ((Array.isArray(tooltip) && tooltip.some(containsContentStyle)) ||
      ('props' in tooltip &&
        tooltip.props &&
        typeof tooltip.props === 'object' &&
        (('className' in tooltip.props && tooltip.props.className === styles.content) ||
          ('children' in tooltip.props &&
            Array.isArray(tooltip.props.children) &&
            tooltip.props.children.some(containsContentStyle))))),
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
  const customizeTooltip = use(TooltipContext);
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
    const tooltip = use(TooltipContext);
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
 * @example
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
  // The timer before we show the presstip (different on hover and press)
  const timer = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  // The triggering element
  const ref = useRef<HTMLDivElement>(null);
  // Allow us to distinguish between press and hover gestures
  const startEvent = useRef<'pointerdown' | 'pointerenter'>(undefined);
  // Absolute timestamp within which we will suppress clicks
  const suppressClickUntil = useRef<number>(0);
  const [open, setOpen] = useState<boolean>(false);

  const closeToolTip = useCallback((e: React.PointerEvent | React.MouseEvent) => {
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

  // Fires on both pointerenter and pointerdown - does double duty for handling both hover tips and press tips
  const hover = useCallback((e: React.PointerEvent) => {
    if (e.type === 'pointerenter' && e.buttons !== 0) {
      // Ignore hover events when the mouse is down
      return;
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

  return (
    <Control
      open={open}
      triggerRef={ref}
      onPointerEnter={hover}
      onPointerDown={hover}
      onPointerLeave={closeToolTip}
      onPointerUp={closeToolTip}
      onPointerCancel={closeToolTip}
      /* onLostPointerCapture closes the tooltip when dragging within our
      SheetHorizontalScrollContainer which handles pointer events itself -
      without this, tooltips never close after the scroller steals the pointer
      capture. */
      onLostPointerCapture={closeToolTip}
      onClick={absorbClick}
      {...props}
    />
  );
}
