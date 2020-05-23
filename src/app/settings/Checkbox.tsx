import React from 'react';
import { Settings } from './initial-settings';
import HelpLink from '../dim-ui/HelpLink';

export default function Checkbox({
  label,
  title,
  value,
  helpLink,
  name,
  onChange,
}: {
  label: string;
  value: boolean;
  title?: string;
  helpLink?: string;
  name: keyof Settings;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <div className="setting horizontal">
      <label htmlFor={name} title={title}>
        {label}
      </label>

      {helpLink && <HelpLink helpLink={helpLink} />}
      <input type="checkbox" id={name} name={name} checked={value} onChange={onChange} />
    </div>
  );
}
