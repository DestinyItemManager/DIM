import React from 'react';
import * as styles from './Select.m.scss';
import { Settings } from './initial-settings';

export default function Select({
  label,
  value,
  name,
  onChange,
  options,
}: {
  label: string;
  value: string | number;
  options: {
    name?: string;
    value: string | number;
  }[];
  name: keyof Settings;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <div className={styles.select}>
      <label htmlFor={name}>{label}</label>
      <select name={name} value={value} required={true} onChange={onChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.name ? option.name : option.value}
          </option>
        ))}
      </select>
    </div>
  );
}

export function mapToOptions(map: { [key: string]: string }) {
  return Object.entries(map).map(([key, value]) => ({
    name: value,
    value: key,
  }));
}
