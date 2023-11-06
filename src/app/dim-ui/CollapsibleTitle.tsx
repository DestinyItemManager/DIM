import { collapsedSelector } from 'app/dim-api/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import { AnimatePresence, Spring, Variants, motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { toggleCollapsedSection } from '../settings/actions';
import { AppIcon, collapseIcon, expandIcon } from '../shell/icons';
import './CollapsibleTitle.scss';

export default function CollapsibleTitle({
  title,
  defaultCollapsed,
  children,
  extra,
  showExtraOnlyWhenCollapsed,
  className,
  disabled,
  sectionId,
  style,
}: {
  sectionId: string;
  defaultCollapsed?: boolean;
  title: React.ReactNode;
  /** right-aligned content that's in the title bar, but isn't the title */
  extra?: React.ReactNode;
  /** if true, the `extra` content shows up only when this section is collapsed */
  showExtraOnlyWhenCollapsed?: boolean;
  /** if true, this section is forced closed and ignores clicks */
  disabled?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const dispatch = useThunkDispatch();
  const collapsedSetting = useSelector(collapsedSelector(sectionId));
  const collapsed = Boolean(disabled) || (collapsedSetting ?? Boolean(defaultCollapsed));

  const toggle = useCallback(
    () => disabled || dispatch(toggleCollapsedSection(sectionId)),
    [disabled, dispatch, sectionId],
  );

  return (
    <>
      <div
        className={clsx(
          'title',
          className,
          { collapsed },
          disabled && collapsed && 'disabled-collapsed',
        )}
        style={style}
        onClick={toggle}
      >
        <span className="collapse-handle">
          <AppIcon className="collapse-icon" icon={collapsed ? expandIcon : collapseIcon} />{' '}
          <span>{title}</span>
        </span>
        {showExtraOnlyWhenCollapsed ? collapsed && extra : extra}
      </div>
      <CollapsedSection collapsed={collapsed}>{children}</CollapsedSection>
    </>
  );
}

const collapsibleTitleAnimateVariants: Variants = {
  open: { height: 'auto' },
  collapsed: { height: 0 },
};
const collapsibleTitleAnimateTransition: Spring = { type: 'spring', duration: 0.5, bounce: 0 };

export function CollapsedSection({
  collapsed,
  children,
}: {
  collapsed: boolean;
  children: React.ReactNode;
}) {
  const initialMount = useRef(true);

  useEffect(() => {
    initialMount.current = false;
  }, [initialMount]);

  return (
    <AnimatePresence>
      {!collapsed && (
        <motion.div
          key="content"
          initial={initialMount.current ? false : 'collapsed'}
          animate="open"
          exit="collapsed"
          variants={collapsibleTitleAnimateVariants}
          transition={collapsibleTitleAnimateTransition}
          className="collapse-content"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
