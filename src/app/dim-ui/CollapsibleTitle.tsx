import { settingsSelector } from 'app/settings/reducer';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { toggleCollapsedSection } from '../settings/actions';
import { AppIcon, collapseIcon, expandIcon } from '../shell/icons';
import './CollapsibleTitle.scss';

interface ProvidedProps {
  sectionId: string;
  defaultCollapsed?: boolean;
  title: React.ReactNode;
  extra?: React.ReactNode;
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
    collapsed: collapsed === undefined ? Boolean(props.defaultCollapsed) : collapsed,
  };
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: ProvidedProps): DispatchProps {
  return {
    toggle: () => {
      dispatch(toggleCollapsedSection(ownProps.sectionId));
    },
  };
}

type Props = StoreProps & ProvidedProps & DispatchProps;

function CollapsibleTitle({ title, collapsed, children, toggle, extra, className, style }: Props) {
  return (
    <>
      <div className={clsx('title', className, { collapsed })} style={style} onClick={toggle}>
        <span className="collapse-handle">
          <AppIcon className="collapse-icon" icon={collapsed ? expandIcon : collapseIcon} />{' '}
          <span>{title}</span>
        </span>
        {extra}
      </div>
      {!collapsed && children}
    </>
  );
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(CollapsibleTitle);
