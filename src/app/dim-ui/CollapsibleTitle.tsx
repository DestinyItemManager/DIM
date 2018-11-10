import * as React from 'react';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import { toggleCollapsedSection } from '../settings/actions';
import { Dispatch } from 'redux';
import { AppIcon, expandIcon, collapseIcon } from '../shell/icons';
import classNames from 'classnames';
import './CollapsibleTitle.scss';

interface ProvidedProps {
  sectionId: string;
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
  return {
    collapsed: state.settings.collapsedSections[props.sectionId]
  };
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: ProvidedProps): DispatchProps {
  return {
    toggle: () => {
      dispatch(toggleCollapsedSection(ownProps.sectionId));
    }
  };
}

type Props = StoreProps & ProvidedProps & DispatchProps;

class CollapsibleTitle extends React.Component<Props> {
  render() {
    const { title, collapsed, children, toggle, extra, className, style } = this.props;
    return (
      <>
        <div
          className={classNames('title', className, { collapsed })}
          style={style}
          onClick={toggle}
        >
          <span className="collapse-handle">
            <AppIcon className="collapse" icon={collapsed ? expandIcon : collapseIcon} />{' '}
            <span>{title}</span>
          </span>
          {extra}
        </div>
        {!collapsed && children}
      </>
    );
  }
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(CollapsibleTitle);
