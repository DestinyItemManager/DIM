import clsx from 'clsx';
import React from 'react';
import styles from './Switch.m.scss';

export default function Switch({
  checked,
  onChange,
  name,
  className,
  disabled = false,
}: {
  label?: React.ReactNode;
  checked: boolean;
  name: string;
  className?: string;
  disabled?: boolean;
  onChange(checked: boolean, name: string): void;
}) {
  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked, name);
  };

  return (
    <div className={clsx(styles.switch, className)}>
      <input
        type="checkbox"
        id={name}
        className="onoffswitch-checkbox"
        checked={checked}
        onChange={change}
        disabled={disabled}
      />
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label htmlFor={name} />
    </div>
  );
}
