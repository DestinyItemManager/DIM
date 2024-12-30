import React from 'react';
import styles from './NotificationButton.m.scss';

/**
 * an independent element fed into showNotification({body:
 * attach your own functionality to its onClick when creating it.
 * jsx children are the button's label
 */
export default function NotificationButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <span className={styles.button} onClick={onClick}>
      {children}
    </span>
  );
}
