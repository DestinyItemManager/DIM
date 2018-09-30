import * as React from 'react';
import { Settings } from './reducer';
import { t } from 'i18next';

export default function Select({
  label,
  value,
  name,
  onChange,
  options
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
    <div className="setting horizontal">
      <label htmlFor={name}>{t(label)}</label>
      <select id={name} value={value} required={true} onChange={onChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.name ? option.name : option.value}
          </option>
        ))}
      </select>
    </div>
  );
}
