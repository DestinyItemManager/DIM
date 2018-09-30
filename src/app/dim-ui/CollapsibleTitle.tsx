import * as React from 'react';
import classNames from 'classnames';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import { toggleCollapsedSection } from '../settings/actions';
import { Dispatch } from 'redux';

interface ProvidedProps {
  sectionId: string;
  title: React.ReactNode;
  children?: React.ReactNode;
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
    const { title, collapsed, children, toggle } = this.props;
    return (
      <>
        <div className="title" onClick={toggle}>
          <span className="collapse-handle">
            <i
              className={classNames(
                'fa collapse',
                collapsed ? 'fa-plus-square-o' : 'fa-minus-square-o'
              )}
            />{' '}
            <span>{title}</span>
          </span>
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
