import clsx from 'clsx';
import React from 'react';
import styles from './ClosableContainer.m.scss';

/**
 * A generic wrapper that adds a "close" button in the top right corner.
 * If the onClose function isn't passed in the close button won't appear
 * allowing dynamic enable/disable functionality.
 */
export default function ClosableContainer({
  children,
  className,
  showCloseIconOnHover = false,
  onClose,
}: {
  children: React.ReactNode;
  className?: string;
  showCloseIconOnHover?: boolean;
  onClose?(e: React.MouseEvent): void;
}) {
  return (
    <div
      className={clsx(className, styles.container, {
        [styles.showCloseOnHover]: showCloseIconOnHover,
      })}
    >
      {children}
      {Boolean(onClose) && (
        <div className={clsx(styles.close)} onClick={onClose} role="button" tabIndex={0} />
      )}
    </div>
  );
}
