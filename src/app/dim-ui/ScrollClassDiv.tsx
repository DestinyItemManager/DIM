import React from 'react';
import styles from './ScrollClassDiv.m.scss';

export default React.memo(function ScrollClassDiv({
  children,
  ...divProps
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <>
      <div {...divProps}>{children}</div>
      <div className={styles.shadow}></div>
      <div className={styles.cover}></div>
    </>
  );
});
