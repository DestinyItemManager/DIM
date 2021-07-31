import { collapsedSelector } from 'app/dim-api/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { toggleCollapsedSection } from '../settings/actions';
import { AppIcon, collapseIcon, expandIcon } from '../shell/icons';
import './CollapsibleTitle.scss';

interface ProvidedProps {
  sectionId: string;
  defaultCollapsed?: boolean;
  title: React.ReactNode;
  /** right-aligned content that's in the title bar, but isn't the title */
  extra?: React.ReactNode;
  /** if true, the `extra` content shows up only when this section is collapsed */
  extraOnlyCollapsed?: boolean;
  /** if true, this section is forced closed and ignores clicks */
  disabled?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

interface StoreProps {
  collapsed: boolean;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  const collapsed = collapsedSelector(props.sectionId)(state);
  return {
    collapsed: Boolean(props.disabled) || (collapsed ?? Boolean(props.defaultCollapsed)),
  };
}

type Props = StoreProps & ProvidedProps;

function CollapsibleTitle({
  title,
  collapsed,
  children,
  extra,
  extraOnlyCollapsed,
  className,
  disabled,
  sectionId,
  style,
}: Props) {
  const dispatch = useThunkDispatch();
  const initialMount = useRef(true);

  useEffect(() => {
    initialMount.current = false;
  }, [initialMount]);

  const toggle = useCallback(
    () => disabled || dispatch(toggleCollapsedSection(sectionId)),
    [disabled, dispatch, sectionId]
  );

  return (
    <>
      <div className={clsx('title', className, { collapsed })} style={style} onClick={toggle}>
        <span className="collapse-handle">
          <AppIcon className="collapse-icon" icon={collapsed ? expandIcon : collapseIcon} />{' '}
          <span>{title}</span>
        </span>
        {extraOnlyCollapsed ? collapsed && extra : extra}
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
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

export default connect<StoreProps>(mapStateToProps)(CollapsibleTitle);
