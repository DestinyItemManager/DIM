import _ from 'lodash';
import React, { useRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import styles from './Loading.m.scss';

const transitionClasses = {
  enter: styles.textEnter,
  enterActive: styles.textEnterActive,
  exit: styles.textExit,
  exitActive: styles.textExitActive,
};

export function Loading({ message }: { message?: string }) {
  const nodeRef = useRef<HTMLDivElement>(null);
  return (
    <section className={styles.loading}>
      <div className={styles.container}>
        {_.times(16, (n) => (
          <div key={n} className={styles.square} />
        ))}
      </div>

      {message && (
        <TransitionGroup className={styles.textContainer}>
          <CSSTransition
            key={message}
            nodeRef={nodeRef}
            classNames={transitionClasses}
            timeout={{ enter: 200, exit: 200 }}
          >
            <div ref={nodeRef} className={styles.text}>
              {message}
            </div>
          </CSSTransition>
        </TransitionGroup>
      )}
    </section>
  );
}
