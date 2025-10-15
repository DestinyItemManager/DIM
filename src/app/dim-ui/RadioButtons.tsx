import clsx from 'clsx';
import { memo, useMemo } from 'react';
import * as styles from './RadioButtons.m.scss';

export interface Option<T extends string | number> {
  label: React.ReactNode;
  tooltip?: React.ReactNode;
  value: T;
}

let nameCounter = 1;

/**
 * A controlled component for a horizontal radio button strip, where one button can be selected at a time.
 */
function RadioButtons<T extends string | number>({
  className,
  value,
  onChange,
  options,
}: {
  className?: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const name = useMemo(() => `radio-${nameCounter++}`, []);
  return (
    <div className={clsx(styles.buttons, className)}>
      {options.map((option) => (
        <RadioButton
          key={option.value}
          option={option}
          selected={option.value === value}
          onChange={onChange}
          name={name}
        />
      ))}
    </div>
  );
}

function RadioButton<T extends string | number>({
  option: { label, value },
  name,
  selected,
  onChange,
}: {
  option: Option<T>;
  name: string;
  selected: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <label
      className={clsx(styles.button, {
        [styles.selected]: selected,
      })}
    >
      <input type="radio" name={name} checked={selected} onChange={() => onChange(value)} />
      {label}
    </label>
  );
}

export default memo(RadioButtons) as typeof RadioButtons;
