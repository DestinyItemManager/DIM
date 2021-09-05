import clsx from 'clsx';
import React from 'react';
import styles from './ClosableContainer.m.scss';

/**
 * A generic wrapper that adds a "close" button in the top right corner.
 */
export default function ClosableContainer({
  children,
  className,
  enabled = true,
  showCloseIconOnHover = false,
  onClose,
}: {
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
  showCloseIconOnHover?: boolean;
  onClose(e: React.MouseEvent): void;
}) {
  return (
    <div
      className={clsx(className, styles.container, {
        [styles.showCloseOnHover]: showCloseIconOnHover,
      })}
    >
      {children}
      {enabled && (
        <div className={clsx(styles.close)} onClick={onClose} role="button" tabIndex={0} />
      )}
    </div>
  );
}
