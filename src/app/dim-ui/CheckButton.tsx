import clsx from 'clsx';
import React from 'react';
import * as styles from './CheckButton.m.scss';
import Switch from './Switch';

export default function CheckButton({
  name,
  onChange,
  className,
  checked,
  children,
}: {
  name: string;
  checked: boolean;
  className?: string;
  children: React.ReactNode;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={clsx(styles.checkButton, className)}>
      <span>{children}</span>
      <Switch name={name} checked={checked} onChange={(checked) => onChange(checked)} />
    </label>
  );
}
