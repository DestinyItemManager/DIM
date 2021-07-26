import { RootState } from 'app/store/types';
import clsx from 'clsx';
import _ from 'lodash';
import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Loading } from './Loading';
import styles from './PageLoading.m.scss';

const messageSelector = (state: RootState) => _.last(state.shell.loadingMessages);

const transitionClasses = {
  enter: styles.pageLoadingEnter,
  enterActive: styles.pageLoadingEnterActive,
  exit: styles.pageLoadingExit,
  exitActive: styles.pageLoadingExitActive,
};

/**
 * This displays the page-level loading screen. React Suspense can make this obsolete once it's available.
 */
export default function PageLoading() {
  const message = useSelector(messageSelector);
  const nodeRef = useRef<HTMLDivElement>(null);
  return (
    <TransitionGroup component={null}>
      {message !== undefined && (
        <CSSTransition
          nodeRef={nodeRef}
          classNames={transitionClasses}
          timeout={{ enter: 600, exit: 300 }}
        >
          <div ref={nodeRef} className={clsx('dim-page', styles.pageLoading)}>
            <Loading message={message} />
          </div>
        </CSSTransition>
      )}
    </TransitionGroup>
  );
}
