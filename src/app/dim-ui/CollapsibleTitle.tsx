import { collapsedSelector } from 'app/dim-api/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { toggleCollapsedSection } from '../settings/actions';
import { AppIcon, collapseIcon, expandIcon } from '../shell/icons';
import './CollapsibleTitle.scss';

interface Props {
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
}: Props) {
  const dispatch = useThunkDispatch();
  const collapsedSetting = useSelector(collapsedSelector(sectionId));
  const collapsed = Boolean(disabled) || (collapsedSetting ?? Boolean(defaultCollapsed));
  const initialMount = useRef(true);

  useEffect(() => {
    initialMount.current = false;
  }, [initialMount]);

  const toggle = useCallback(
    () => disabled || dispatch(toggleCollapsedSection(sectionId)),
    [disabled, dispatch, sectionId]
  );

  const id = `collapsible-${sectionId}`;

  return (
    <>
      <div
        className={clsx(
          'title',
          className,
          { collapsed },
          disabled && collapsed && 'disabled-collapsed'
        )}
        style={style}
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-controls={id}
      >
        <span className="collapse-handle">
          <AppIcon className="collapse-icon" icon={collapsed ? expandIcon : collapseIcon} />{' '}
          <span>{title}</span>
        </span>
        {showExtraOnlyWhenCollapsed ? collapsed && extra : extra}
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            id={id}
            key="content"
            initial={initialMount.current ? false : 'collapsed'}
            animate="open"
            exit="collapsed"
            variants={{
              open: { height: 'auto' },
              collapsed: { height: 0 },
            }}
            transition={{ duration: 0.3 }}
            className="collapse-content"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
