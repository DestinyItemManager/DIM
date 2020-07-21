import React from 'react';
import styles from './ClosableContainer.m.scss';

/**
 * A generic wrapper that adds a "close" button in the top right corner.
 */
export default function ClosableContainer({
  children,
  enabled = true,
  onClose,
}: {
  children: React.ReactNode;
  enabled?: boolean;
  onClose(): void;
}) {
  return (
    <div className={styles.container}>
      {children}
      {enabled && <div className={styles.close} onClick={onClose} role="button" tabIndex={0} />}
    </div>
  );
}
