import clsx from 'clsx';
import React from 'react';
import styles from './ActionButton.m.scss';

export default function ActionButton({
  disabled,
  title,
  children,
  onClick,
}: {
  title?: string;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={clsx(styles.actionButton, { [styles.disabled]: disabled })}
      onClick={onClick}
      title={title}
      role="button"
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
