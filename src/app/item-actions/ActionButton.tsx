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
    <button
      type="button"
      className={clsx(styles.actionButton)}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
