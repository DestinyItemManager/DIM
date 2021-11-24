import clsx from 'clsx';
import React from 'react';
import styles from './StaticPage.m.scss';

/**
 * Styled wrapper for "static pages" - e.g. informational pages like About.
 */
export default function StaticPage({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(styles.page, className)}>{children}</div>;
}
