import clsx from 'clsx';
import React from 'react';
import * as styles from './Switch.m.scss';

export default function Switch<K extends string>({
  checked,
  onChange,
  name,
  className,
  disabled = false,
}: {
  checked: boolean;
  name: K;
  className?: string;
  disabled?: boolean;
  onChange: (checked: boolean, name: K) => void;
}) {
  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked, name);
  };

  return (
    <div className={clsx(styles.switch, className)}>
      <input
        type="checkbox"
        id={name}
        role="switch"
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
