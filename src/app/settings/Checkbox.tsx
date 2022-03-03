import HelpLink from 'app/dim-ui/HelpLink';
import Switch from 'app/dim-ui/Switch';
import React from 'react';
import { Settings } from './initial-settings';

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
  onChange: (checked: boolean, name: keyof Settings) => void;
}) {
  return (
    <div className="setting horizontal">
      <label htmlFor={name} title={title}>
        {label}
      </label>

      {helpLink && <HelpLink helpLink={helpLink} />}
      <Switch name={name} checked={value} onChange={onChange} />
    </div>
  );
}
