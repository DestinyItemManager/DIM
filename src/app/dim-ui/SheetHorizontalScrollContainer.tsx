import clsx from 'clsx';
import React from 'react';
import styles from './SheetHorizontalScrollContainer.m.scss';

/**
 * We have issues on mobile where horizontal scrolling of flex components doesn't work for some unknown reason. This
 * component is a workaround that captures pointer events when the pointer has been triggered via the down state and
 * has also been moved by HORIZ_SCROLL_DRAG_THRESHOLD pixels. This ensures that button clicks in the component don't
 * get interupted and work as expected.
 */

export function SheetHorizontalScrollContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={clsx(styles.horizontalScrollContainer, className)}>{children}</div>;
}
