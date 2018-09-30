import * as React from 'react';
import { Settings } from './settings';
import { t } from 'i18next';

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

      {helpLink && (
        <a
          className="fa fa-question-circle stylizedAnchor"
          aria-hidden="true"
          href={helpLink}
          target="_blank"
          rel="noopener noreferrer"
        />
      )}
      <input type="checkbox" name={name} checked={value} onChange={onChange} />
    </div>
  );
}
