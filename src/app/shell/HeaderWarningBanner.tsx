import React from 'react';
import styles from './HeaderWarningBanner.m.scss';

/** A red warning banner shown on the header of the app */
export default function HeaderWarningBanner({ children }: { children: React.ReactNode }) {
  return <div className={styles.banner}>{children}</div>;
}
