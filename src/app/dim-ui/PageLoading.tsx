import React from 'react';
import { connect } from 'react-redux';
import { ThunkDispatchProp, RootState } from 'app/store/reducers';
import { Loading } from './Loading';
import _ from 'lodash';
import styles from './PageLoading.m.scss';
import clsx from 'clsx';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

interface StoreProps {
  message?: string;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    message: _.last(state.shell.loadingMessages)
  };
}

type Props = StoreProps & ThunkDispatchProp;

const transitionClasses = {
  enter: styles.pageLoadingEnter,
  enterActive: styles.pageLoadingEnterActive,
  exit: styles.pageLoadingExit,
  exitActive: styles.pageLoadingExitActive
};

/**
 * This displays the page-level loading screen. React Suspense can make this obsolete once it's available.
 */
function PageLoading({ message }: Props) {
  return (
    <TransitionGroup component={null}>
      {message !== undefined && (
        <CSSTransition classNames={transitionClasses} timeout={{ enter: 600, exit: 300 }}>
          <div className={clsx('dim-page', styles.pageLoading)}>
            <Loading message={message} />
          </div>
        </CSSTransition>
      )}
    </TransitionGroup>
  );
}

export default connect<StoreProps>(mapStateToProps)(PageLoading);
