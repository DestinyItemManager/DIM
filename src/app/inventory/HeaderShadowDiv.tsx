import React from 'react';
import styles from './HeaderShadowDiv.m.scss';

// Requires `--store-header-height` to be set
export default React.memo(({ children, ...divProps }: React.HTMLAttributes<HTMLDivElement>) => (
  <>
    <div {...divProps}>{children}</div>
    <div className={styles.shadow}></div>
    <div className={styles.cover}></div>
  </>
));
