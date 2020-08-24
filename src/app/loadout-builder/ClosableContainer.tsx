import React from 'react';
import styles from './ClosableContainer.m.scss';
import clsx from 'clsx';

/**
 * A generic wrapper that adds a "close" button in the top right corner.
 */
export default function ClosableContainer({
  children,
  enabled = true,
  showCloseIconOnHover = false,
  onClose,
}: {
  children: React.ReactNode;
  enabled?: boolean;
  showCloseIconOnHover?: boolean;
  onClose(): void;
}) {
  return (
    <div className={clsx(styles.container, { [styles.showCloseOnHover]: showCloseIconOnHover })}>
      {children}
      {enabled && (
        <div className={clsx(styles.close)} onClick={onClose} role="button" tabIndex={0} />
      )}
    </div>
  );
}
