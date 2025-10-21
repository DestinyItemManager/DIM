import { collapsedSelector } from 'app/dim-api/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import { AnimatePresence, Transition, Variants, motion } from 'motion/react';
import React, { useCallback, useEffect, useId, useRef } from 'react';
import { useSelector } from 'react-redux';
import { toggleCollapsedSection } from '../settings/actions';
import { AppIcon, collapseIcon } from '../shell/icons';
import * as styles from './CollapsibleTitle.m.scss';
import ErrorBoundary from './ErrorBoundary';

export function Title({
  title,
  collapsed,
  extra,
  showExtraOnlyWhenCollapsed,
  className,
  disabled,
  style,
  headerId,
  contentId,
  onClick,
  ref,
}: {
  headerId: string;
  contentId: string;
  collapsed: boolean;
  title: React.ReactNode;
  /** right-aligned content that's in the title bar, but isn't the title */
  extra?: React.ReactNode;
  /** if true, the `extra` content shows up only when this section is collapsed */
  showExtraOnlyWhenCollapsed?: boolean;
  /** if true, this section is forced closed and ignores clicks */
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick: () => void;
  ref?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <h3
      className={clsx(styles.title, className, {
        [styles.collapsed]: collapsed,
        [styles.disabled]: disabled,
      })}
      style={style}
      ref={ref}
    >
      <button
        type="button"
        aria-expanded={!collapsed}
        aria-controls={contentId}
        onClick={onClick}
        disabled={disabled}
        id={headerId}
      >
        {!disabled && <CollapseIcon collapsed={collapsed} />}
        {title}
      </button>
      {showExtraOnlyWhenCollapsed ? collapsed && extra : extra}
    </h3>
  );
}

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
    () => dispatch(toggleCollapsedSection(sectionId)),
    [dispatch, sectionId],
  );

  const id = useId();
  const contentId = `content-${id}`;
  const headerId = `header-${id}`;

  return (
    <>
      <Title
        title={title}
        collapsed={collapsed}
        extra={extra}
        showExtraOnlyWhenCollapsed={showExtraOnlyWhenCollapsed}
        className={className}
        disabled={disabled}
        style={style}
        headerId={headerId}
        contentId={contentId}
        onClick={toggle}
      />
      <CollapsedSection collapsed={collapsed} headerId={headerId} contentId={contentId}>
        <ErrorBoundary name={`collapse-${sectionId}`} key={contentId}>
          {children}
        </ErrorBoundary>
      </CollapsedSection>
    </>
  );
}

export function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <AppIcon
      className={clsx(styles.collapseIcon, { [styles.iconCollapsed]: collapsed })}
      icon={collapseIcon}
      ariaHidden
    />
  );
}

const collapsibleTitleAnimateVariants: Variants = {
  open: { height: 'auto' },
  collapsed: { height: 0 },
};
const collapsibleTitleAnimateTransition: Transition<number> = {
  type: 'spring',
  duration: 0.5,
  bounce: 0,
};

export function CollapsedSection({
  collapsed,
  children,
  headerId,
  contentId,
}: {
  collapsed: boolean;
  children: React.ReactNode;
  headerId: string;
  contentId: string;
}) {
  const initialMount = useRef(true);

  useEffect(() => {
    initialMount.current = false;
  }, [initialMount]);

  return (
    <AnimatePresence>
      {!collapsed && (
        <motion.div
          id={contentId}
          aria-labelledby={headerId}
          key="content"
          initial={initialMount.current ? false : 'collapsed'}
          animate="open"
          exit="collapsed"
          variants={collapsibleTitleAnimateVariants}
          transition={collapsibleTitleAnimateTransition}
          className={styles.content}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
