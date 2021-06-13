import { settingsSelector } from 'app/dim-api/selectors';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
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

interface DispatchProps {
  toggle(): void;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  const collapsed = settingsSelector(state).collapsedSections[props.sectionId];
  return {
    collapsed: Boolean(props.disabled) || (collapsed ?? Boolean(props.defaultCollapsed)),
  };
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: ProvidedProps): DispatchProps {
  return {
    toggle: () => {
      ownProps.disabled || dispatch(toggleCollapsedSection(ownProps.sectionId));
    },
  };
}

type Props = StoreProps & ProvidedProps & DispatchProps;

function CollapsibleTitle({
  title,
  collapsed,
  children,
  toggle,
  extra,
  extraOnlyCollapsed,
  className,
  style,
}: Props) {
  const initialMount = useRef(true);

  useEffect(() => {
    initialMount.current = false;
  }, [initialMount]);

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

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(CollapsibleTitle);
