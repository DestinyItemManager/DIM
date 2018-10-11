import * as React from 'react';
import { Settings } from './reducer';
import { t } from 'i18next';
import * as _ from 'lodash';

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
  return _.map(map, (value, key) => {
    return {
      name: value,
      value: key
    };
  });
}

export function listToOptions(list: string[]) {
  return list.map((value) => ({ value }));
}
