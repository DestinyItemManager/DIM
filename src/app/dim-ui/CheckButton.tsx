import clsx from 'clsx';
import React from 'react';
import styles from './CheckButton.m.scss';

export default function CheckButton({
  onChange,
  className,
  checked,
  children,
}: {
  checked: boolean;
  className?: string;
  children: React.ReactNode;
  onChange(checked: boolean);
}) {
  return (
    <label className={clsx(styles.checkButton, className)}>
      {children}{' '}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
