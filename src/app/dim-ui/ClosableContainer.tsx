import clsx from 'clsx';
import React from 'react';
import * as styles from './ClosableContainer.m.scss';

/**
 * A generic wrapper that adds a "close" button in the top right corner.
 * If the onClose function isn't passed in the close button won't appear
 * allowing dynamic enable/disable functionality.
 */
export default function ClosableContainer({
  children,
  className,
  onClose,
}: {
  children: React.ReactNode;
  className?: string;
  onClose?: (e: React.MouseEvent) => void;
}) {
  return (
    <div className={clsx(className, styles.container)}>
      {children}
      {Boolean(onClose) && (
        <div className={styles.close} onClick={onClose} role="button" tabIndex={0} />
      )}
    </div>
  );
}
