import React from 'react';
import styles from './ClosableContainer.m.scss';

export default function ClosableContainer({
  children,
  onClose
}: {
  children: React.ReactNode;
  onClose(): void;
}) {
  return (
    <div className={styles.container}>
      {children}
      <div className={styles.close} onClick={onClose} role="button" tabIndex={0} />
    </div>
  );
}
