import Switch from 'app/dim-ui/Switch';
import HelpLink from '../dim-ui/HelpLink';
import { horizontalClass } from './SettingsPage';
import { Settings } from './initial-settings';

export default function Checkbox({
  label,
  title,
  value,
  helpLink,
  name,
  onChange,
}: {
  label: React.ReactNode;
  value: boolean;
  title?: string;
  helpLink?: string;
  name: keyof Settings;
  onChange: (checked: boolean, name: keyof Settings) => void;
}) {
  return (
    <div className={horizontalClass}>
      <label htmlFor={name} title={title}>
        {label}
      </label>

      {helpLink && <HelpLink helpLink={helpLink} />}
      <Switch name={name} checked={value} onChange={onChange} />
    </div>
  );
}
