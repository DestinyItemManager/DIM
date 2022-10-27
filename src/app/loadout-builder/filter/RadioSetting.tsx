import { PressTip } from 'app/dim-ui/PressTip';
import clsx from 'clsx';
import React from 'react';
import styles from './RadioSetting.m.scss';

export interface Option {
  label: string;
  tooltip: string;
  selected: boolean;
  onChange(): void;
}

export const RadioSetting = React.memo(function RadioSetting({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: Option[];
}) {
  return (
    <div className={styles.settingGroup}>
      <div className={styles.title}>{label}</div>
      <div className={styles.buttons}>
        {options.map(({ label, selected, tooltip, onChange }) => (
          <RadioButton
            key={label}
            label={label}
            tooltip={tooltip}
            selected={selected}
            onChange={onChange}
            name={name}
          />
        ))}
      </div>
    </div>
  );
});

function RadioButton({ label, tooltip, name, selected, onChange }: Option & { name: string }) {
  return (
    <PressTip
      tooltip={tooltip}
      elementType="label"
      className={clsx(styles.button, {
        [styles.selected]: selected,
      })}
    >
      <input type="radio" name={name} checked={selected} onChange={onChange} />
      {label}
    </PressTip>
  );
}
