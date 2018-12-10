import * as React from 'react';
import { Settings } from './reducer';
import { t } from 'i18next';
import HelpLink from '../dim-ui/HelpLink';

export default function Checkbox({
  label,
  title,
  value,
  helpLink,
  name,
  onChange
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
      <label htmlFor={name} title={title && t(title)}>
        {t(label)}
      </label>

      <HelpLink helpLink={helpLink} />
      <input type="checkbox" name={name} checked={value} onChange={onChange} />
    </div>
  );
}
