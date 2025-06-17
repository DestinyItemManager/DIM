import { useHotkey } from 'app/hotkeys/useHotkey';
import { t } from 'app/i18next-t';
import ItemPickerContainer from 'app/item-picker/ItemPickerContainer';
import { Portal } from 'app/utils/temp-container';
import SingleVendorSheetContainer from 'app/vendors/single-vendor/SingleVendorSheetContainer';
import clsx from 'clsx';
import {
  PanInfo,
  Transition,
  motion,
  useAnimation,
  useDragControls,
  useReducedMotion,
} from 'motion/react';
import React, {
  createContext,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { AppIcon, disabledIcon } from '../shell/icons';
import ErrorBoundary from './ErrorBoundary';
import { PressTipRoot } from './PressTip';
import styles from './Sheet.m.scss';
import { sheetsOpen } from './sheets-open';
import { useFixOverscrollBehavior } from './useFixOverscrollBehavior';

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
export type SheetContent = React.ReactNode | ((args: { onClose: () => void }) => React.ReactNode);

// The sheet is dismissed if it's flicked at a velocity above dismissVelocity,
// or dragged down more than dismissAmount times the height of the sheet.
const dismissVelocity = 120; // px/ms
const dismissByVelocityMinOffset = 16; // px
const dismissAmount = 0.5;

const spring: Transition<number> = {
  type: 'spring',
  stiffness: 280,
  damping: 20,
  mass: 0.2,
} as const;

const reducedMotionTween = { type: 'tween', duration: 0.01 } as const;

const animationVariants = {
  close: { y: window.innerHeight },
  open: { y: 0 },
} as const;

const dragConstraints = { top: 0, bottom: window.innerHeight } as const;

const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();
const handleKeyDown = (e: React.KeyboardEvent) => {
  // Allow "esc" to propagate which lets you escape focus on inputs.
  if (e.key !== 'Escape') {
    e.stopPropagation();
  }
};

/**
 * Automatically disable the parent sheet while this sheet is shown. You must
 * pass `setParentDisabled` to SheetDisabledContext.Provider.
 */
function useDisableParent(
  forceDisabled?: boolean,
): [disabled: boolean, setParentDisabled: React.Dispatch<React.SetStateAction<boolean>>] {
  const [disabledByChildSheet, setDisabledByChildSheet] = useState(false);
  const setParentDisabled = use(SheetDisabledContext);

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
  closeButtonClassName,
  headerClassName,
  disabled: forceDisabled,
  zIndex,
  freezeInitialHeight,
  allowClickThrough,
  onClose,
}: {
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
  // TODO: remove
  /** Override the z-index of the sheet. Useful when stacking sheets on top of other sheets or on top of the item popup. */
  zIndex?: number;
  /** A custom class name to add to the sheet container. */
  sheetClassName?: string;
  /** A custom class name to add to the sheet close button. */
  closeButtonClassName?: string;
  /** A custom class name to add to the sheet header. */
  headerClassName?: string;
  // TODO: remove
  /** If set, the sheet will always be whatever height it was when first rendered, even if the contents change size. */
  freezeInitialHeight?: boolean;
  // TODO: remove by getting a recursive item popup host
  /**
   * Allow clicks to escape this sheet. This allows for things like the popups
   * in the Compare sheet being closed by clicking in the Compare sheet. By
   * default we block clicks so that clicks in sheets spawned from within an
   * item popup don't close the popup they were spawned from!
   */
  allowClickThrough?: boolean;
  onClose: () => void;
  // TODO: "skinny" sheet option
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const sheetContents = useRef<HTMLDivElement | null>(null);

  const [frozenHeight, setFrozenHeight] = useState<number | undefined>(undefined);
  const frozenHeightIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [disabled, setParentDisabled] = useDisableParent(forceDisabled);

  const reducedMotion = Boolean(useReducedMotion());
  const animationControls = useAnimation();
  const dragControls = useDragControls();

  /**
   * Triggering close starts the animation. The onClose prop is called by the callback
   * passed to the onAnimationComplete motion prop.
   */
  const triggerClose = useCallback(
    (e?: React.MouseEvent | KeyboardEvent) => {
      e?.preventDefault();
      // Animate offscreen
      animationControls.start('close');
    },
    [animationControls],
  );

  // Handle global escape key
  useHotkey('esc', t('Hotkey.ClearDialog'), triggerClose);

  // We need to call the onClose callback when then close animation is complete so that
  // the calling component can unmount the sheet
  // TODO (ryan/ben) move to using a container component and AnimatePresence
  const handleAnimationComplete = useCallback(
    (animationDefinition: 'close' | 'open') => {
      if (animationDefinition === 'close') {
        onClose();
      }
    },
    [onClose],
  );

  // Determine when to drag. Drags if the touch falls in the header, or if the contents
  // are scrolled all the way to the top.
  const dragHandleDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (
        !sheetContents.current!.contains(e.target as Node) ||
        sheetContents.current!.scrollTop === 0
      ) {
        dragControls.start(e);
      }
    },
    [dragControls],
  );

  useFixOverscrollBehavior(sheetContents);

  // When drag ends we determine if the sheet should be closed either via the final
  // drag velocity or if the sheet has been dragged halfway the down from its height.
  const handleDragEnd = useCallback(
    (_event: TouchEvent | MouseEvent | PointerEvent, info: PanInfo) => {
      const velocity = info.velocity.y / window.devicePixelRatio;
      const offset = info.offset.y;
      if (
        (velocity > dismissVelocity && offset > dismissByVelocityMinOffset) ||
        (sheet.current && offset > dismissAmount * sheet.current.clientHeight)
      ) {
        triggerClose();
        return;
      }
      animationControls.start('open');
    },
    [animationControls, triggerClose],
  );

  useLayoutEffect(() => {
    clearInterval(frozenHeightIntervalRef.current);
    if (freezeInitialHeight && sheetContents.current && !frozenHeight) {
      if (sheetContents.current.clientHeight > 0) {
        setFrozenHeight(sheetContents.current.clientHeight);
      } else {
        const setHeight = () => {
          if (!sheetContents.current || sheetContents.current.clientHeight === 0) {
            return false;
          }
          setFrozenHeight(sheetContents.current.clientHeight);
          frozenHeightIntervalRef.current = undefined;
          return true;
        };
        frozenHeightIntervalRef.current = tryRepeatedlyWithLimit(setHeight);
      }
    }
  }, [freezeInitialHeight, frozenHeight]);

  useEffect(() => {
    animationControls.start('open');
  }, [animationControls]);

  // Track the total number of sheets that are open (to help prevent reloads while users are doing things)
  useEffect(() => {
    sheetsOpen.open++;
    return () => {
      sheetsOpen.open--;
    };
  }, []);

  const sheetBody = (
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
      onDragEnd={disabled ? undefined : handleDragEnd}
      // regular props
      style={{ zIndex }}
      className={clsx(styles.sheet, sheetClassName, { [styles.sheetDisabled]: disabled })}
      ref={sheet}
      role="dialog"
      aria-modal="false"
      onKeyDown={handleKeyDown}
      onKeyUp={stopPropagation}
      onKeyPress={stopPropagation}
      onClick={allowClickThrough ? undefined : stopPropagation}
    >
      <button
        type="button"
        className={clsx(styles.close, closeButtonClassName, { [styles.noHeader]: !header })}
        onClick={triggerClose}
        aria-keyshortcuts="esc"
        aria-label={t('General.Close')}
      >
        <AppIcon icon={disabledIcon} />
      </button>

      <div className={styles.container} onPointerDown={disabled ? undefined : dragHandleDown}>
        {Boolean(header) && (
          <div className={clsx(styles.header, headerClassName)}>
            {typeof header === 'function' ? header({ onClose: triggerClose }) : header}
          </div>
        )}

        <div
          className={styles.contents}
          style={frozenHeight ? { flexBasis: frozenHeight } : undefined}
          ref={sheetContents}
        >
          <ErrorBoundary name="sheet-contents">
            {typeof children === 'function' ? children({ onClose: triggerClose }) : children}
          </ErrorBoundary>
        </div>

        {Boolean(footer) && (
          <div className={styles.footer}>
            {typeof footer === 'function' ? footer({ onClose: triggerClose }) : footer}
          </div>
        )}
      </div>
      <div
        className={styles.disabledScreen}
        onClick={stopPropagation}
        onPointerDown={stopPropagation}
      />
    </motion.div>
  );

  return (
    <Portal>
      <SheetDisabledContext value={setParentDisabled}>
        <PressTipRoot value={sheet}>
          <ItemPickerContainer>
            <SingleVendorSheetContainer>{sheetBody}</SingleVendorSheetContainer>
          </ItemPickerContainer>
        </PressTipRoot>
      </SheetDisabledContext>
    </Portal>
  );
}

function tryRepeatedlyWithLimit(callback: () => boolean, timeout = 500, limit = 5_000) {
  let totalTime = 0;
  return setInterval(() => {
    if (totalTime > limit) {
      return;
    }
    const res = callback();
    totalTime += timeout;
    if (res) {
      return;
    }
  }, timeout);
}
