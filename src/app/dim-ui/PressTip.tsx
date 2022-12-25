import { Placement } from '@popperjs/core';
import { tempContainer } from 'app/utils/temp-container';
import clsx from 'clsx';
import _ from 'lodash';
import {
  createContext,
  default as React,
  MutableRefObject,
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
  className?: string;
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
  const [customization, customizeTooltip] = useState<TooltipCustomization>({});

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
  className?: string;
}) {
  const customizeTooltip = useContext(TooltipContext);
  useEffect(() => {
    if (customizeTooltip) {
      customizeTooltip((existing) => ({
        ...existing,
        ...(getHeader && { header: getHeader() }),
        ...(getSubheader && { subheader: getSubheader() }),
        ...(className && { className }),
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
  Customize: ({ className }: { className: string }) => {
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

const isPointerEvents = 'onpointerdown' in window;
const isTouch = 'ontouchstart' in window;
const hoverable = window.matchMedia?.('(hover: hover)').matches;
const hoverDelay = hoverable ? 100 : 300;

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
  const [open, setOpen] = useState<boolean>(false);

  const closeToolTip = useCallback(() => {
    setOpen(false);
    clearTimeout(timer.current);
    timer.current = 0;
  }, []);

  const hover = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent | TouchEvent | React.FocusEvent | React.PointerEvent
    ) => {
      e.preventDefault();
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setOpen(true);
      }, hoverDelay);
      touchStartTime.current = performance.now();
    },
    []
  );

  // Stop the hover timer when the component unmounts
  useEffect(() => () => clearTimeout(timer.current), []);

  // Prevent clicks if the tooltip has been pressed long enough to show a tip
  const absorbClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent | React.FocusEvent | React.PointerEvent) => {
      if (performance.now() - touchStartTime.current > hoverDelay) {
        e.stopPropagation();
      }
    },
    []
  );

  // A combination of React's global event handling strategy and a Safari bug in touch handling
  // means that relying on binding onTouchStart directly will fail to fire touchstart if this
  // element has been scrolled within a position: fixed element - like we frequently do in Sheets.
  useEffect(() => {
    // It's important that this be a passive event handler
    if (!isPointerEvents && isTouch && ref.current) {
      const triggerElement = ref.current;
      triggerElement.addEventListener('touchstart', hover, { passive: true });
      return () => triggerElement.removeEventListener('touchstart', hover);
    }
  }, [hover]);

  const events = isPointerEvents
    ? hoverable
      ? // Mouse/hoverpen based devices with pointer events
        {
          onPointerOver: hover,
          onPointerLeave: closeToolTip,
          onPointerUp: closeToolTip,
        }
      : // Touch-based devices with pointer events
        {
          onPointerOver: hover,
          onPointerDown: hover,
          onPointerLeave: closeToolTip,
          onPointerUp: closeToolTip,
          onClick: absorbClick,
        }
    : isTouch
    ? // Touch-based devices without pointer events
      {
        // onTouchStart is handled specially above
        onTouchEnd: closeToolTip,
        onTouchCancel: closeToolTip,
        onClick: absorbClick,
      }
    : // Mouse based devices without pointer events
      {
        onMouseEnter: hover,
        onMouseUp: closeToolTip,
        onMouseLeave: closeToolTip,
      };

  return <Control open={open} triggerRef={ref} {...events} {...props} />;
}
