import { isiOSBrowser } from 'app/utils/browsers';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import clsx from 'clsx';
import {
  motion,
  PanInfo,
  Spring,
  useAnimation,
  useDragControls,
  useReducedMotion,
} from 'framer-motion';
import _ from 'lodash';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { AppIcon, disabledIcon } from '../shell/icons';
import { PressTipRoot } from './PressTip';
import styles from './Sheet.m.scss';
import './Sheet.scss';

/**
 * Propagates a function for setting a sheet to disabled. This forms a chain as
 * sheets are shown, where each sheet is wired to its parent so that each child
 * disables and re-enables its parent automatically.
 */
const SheetDisabledContext = createContext<(shown: boolean) => void>(() => {
  // No-op
});

/**
 * The contents of the header, footer, and body can be regular elements, or a function that
 * takes an "onClose" function that can be used to close the sheet. Using onClose to close
 * the sheet ensures that it will animate away rather than simply disappearing.
 */
type SheetContent = React.ReactNode | ((args: { onClose: () => void }) => React.ReactNode);

interface Props {
  /** A static, non-scrollable header shown in line with the close button. */
  header?: SheetContent;
  /** A static, non-scrollable footer shown at the bottom of the sheet. Good for buttons. */
  footer?: SheetContent;
  /** Scrollable contents for the sheet. */
  children?: SheetContent;
  /**
   * Disable the sheet (no clicking, dragging, or close-on-esc). The sheet will
   * automatically disable itself if another sheet is shown as a child, so no
   * need to set this explicitly most of the time - pretty much just if you need
   * to communicate that some "global" sheet like the item picker is up.
   */
  disabled?: boolean;
  /** Override the z-index of the sheet. Useful when stacking sheets on top of other sheets or on top of the item popup. */
  zIndex?: number;
  /** A custom class name to add to the sheet container. */
  sheetClassName?: string;
  /** If set, the sheet will always be whatever height it was when first rendered, even if the contents change size. */
  freezeInitialHeight?: boolean;
  /**
   * Allow clicks to escape this sheet. This allows for things like the popups
   * in the Compare sheet being closed by clicking in the Compare sheet. By
   * default we block clicks so that clicks in sheets spawned from within an
   * item popup don't close the popup they were spawned from!
   */
  allowClickThrough?: boolean;
  onClose: () => void;
}

// The sheet is dismissed if it's flicked at a velocity above dismissVelocity,
// or dragged down more than dismissAmount times the height of the sheet.
const dismissVelocity = 250; // px/ms
const dismissAmount = 0.5;

const spring: Spring = {
  type: 'spring',
  stiffness: 180,
  damping: 20,
  mass: 0.5,
} as const;

const reducedMotionTween = { type: 'tween', duration: 0.01 } as const;

const animationVariants = {
  close: { y: window.innerHeight },
  open: { y: 0 },
} as const;

const dragConstraints = { top: 0, bottom: window.innerHeight } as const;

const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

/**
 * Automatically disable the parent sheet while this sheet is shown. You must
 * pass `setParentDisabled` to SheetDisabledContext.Provider.
 */
function useDisableParent(
  forceDisabled?: boolean
): [disabled: boolean, setParentDisabled: React.Dispatch<React.SetStateAction<boolean>>] {
  const [disabledByChildSheet, setDisabledByChildSheet] = useState(false);
  const setParentDisabled = useContext(SheetDisabledContext);

  const effectivelyDisabled = forceDisabled || disabledByChildSheet;

  useEffect(() => {
    setParentDisabled(true);
    return () => setParentDisabled(false);
  }, [setParentDisabled]);

  return [effectivelyDisabled, setDisabledByChildSheet];
}

/**
 * A Sheet is a UI element that comes up from the bottom of the screen,
 * and can be dragged downward to dismiss
 */
export default function Sheet({
  header,
  footer,
  children,
  sheetClassName,
  disabled: forceDisabled,
  zIndex,
  freezeInitialHeight,
  allowClickThrough,
  onClose,
}: Props) {
  const sheet = useRef<HTMLDivElement>(null);
  const sheetContents = useRef<HTMLDivElement | null>(null);
  const sheetContentsRefFn = useLockSheetContents(sheetContents);
  const dragHandle = useRef<HTMLDivElement>(null);

  const [frozenHeight, setFrozenHeight] = useState<number | undefined>(undefined);
  const [disabled, setParentDisabled] = useDisableParent(forceDisabled);

  const reducedMotion = Boolean(useReducedMotion());
  const animationControls = useAnimation();
  const dragControls = useDragControls();

  /**
   * Triggering close starts the animation. The onClose prop is called by the callback
   * passed to the onAnimationComplete motion prop
   */
  const triggerClose = useCallback(
    (e?: React.MouseEvent) => {
      if (disabled) {
        return;
      }
      e?.preventDefault();
      // Animate offscreen
      animationControls.start('close');
    },
    [disabled, animationControls]
  );

  // Handle global escape key
  useGlobalEscapeKey(triggerClose);

  // We need to call the onClose callback when then close animation is complete so that
  // the calling component can unmount the sheet
  const handleAnimationComplete = useCallback(
    (animationDefinition: 'close' | 'open') => {
      if (animationDefinition === 'close') {
        onClose();
      }
    },
    [onClose]
  );

  // Determine when to drag. Drags if the touch falls in the header, or if the contents
  // are scrolled all the way to the top.
  const dragHandleDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // prevent item-tag-selector dropdown from triggering drag (Safari)
      if (isInside(e.target as HTMLElement, 'item-tag-selector')) {
        return;
      }

      if (
        dragHandle.current?.contains(e.target as Node) ||
        sheetContents.current!.scrollTop === 0
      ) {
        dragControls.start(e);
      }
    },
    [dragControls]
  );

  // When drag ends we determine if the sheet should be closed either via the final
  // drag velocity or if the sheet has been dragged halfway the down from its height.
  const handleDragEnd = useCallback(
    (_event: TouchEvent | MouseEvent | PointerEvent, info: PanInfo) => {
      if (
        info.velocity.y > dismissVelocity ||
        (sheet.current && info.offset.y > dismissAmount * sheet.current.clientHeight)
      ) {
        triggerClose();
        return;
      }
      animationControls.start('open');
    },
    [animationControls, triggerClose]
  );

  useLayoutEffect(() => {
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

  useEffect(() => {
    animationControls.start('open');
  }, [animationControls]);

  return (
    <SheetDisabledContext.Provider value={setParentDisabled}>
      <PressTipRoot.Provider value={sheet}>
        <motion.div
          // motion props
          initial="close"
          transition={reducedMotion ? reducedMotionTween : spring}
          animate={animationControls}
          variants={animationVariants}
          onAnimationComplete={handleAnimationComplete}
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={dragConstraints}
          dragElastic={0}
          onDragEnd={handleDragEnd}
          // regular props
          style={{ zIndex }}
          className={clsx('sheet', sheetClassName, { [styles.sheetDisabled]: disabled })}
          ref={sheet}
          role="dialog"
          aria-modal="false"
          onKeyDown={stopPropagation}
          onKeyUp={stopPropagation}
          onKeyPress={stopPropagation}
          onClick={allowClickThrough ? undefined : stopPropagation}
        >
          <a
            href="#"
            className={clsx('sheet-close', { 'sheet-no-header': !header })}
            onClick={triggerClose}
          >
            <AppIcon icon={disabledIcon} />
          </a>

          <div className="sheet-container" onPointerDown={dragHandleDown}>
            {Boolean(header) && (
              <div className="sheet-header" ref={dragHandle}>
                {_.isFunction(header) ? header({ onClose: triggerClose }) : header}
              </div>
            )}

            <div
              className={clsx('sheet-contents', {
                'sheet-has-footer': footer,
              })}
              style={frozenHeight ? { flexBasis: frozenHeight } : undefined}
              ref={sheetContentsRefFn}
            >
              {_.isFunction(children) ? children({ onClose: triggerClose }) : children}
            </div>

            {Boolean(footer) && (
              <div className="sheet-footer">
                {_.isFunction(footer) ? footer({ onClose: triggerClose }) : footer}
              </div>
            )}
          </div>
          <div className={styles.disabledScreen} />
        </motion.div>
      </PressTipRoot.Provider>
    </SheetDisabledContext.Provider>
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
        if (isiOSBrowser()) {
          // as-is, body-scroll-lock does not work on on Android #5615
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
        sheetContents.current.removeEventListener('touchstart', blockEvents);
        if (isiOSBrowser()) {
          setTimeout(() => {
            document.body.classList.remove('body-scroll-lock');
          }, 0);
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
