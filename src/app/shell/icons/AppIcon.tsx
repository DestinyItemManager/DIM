import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export function AppIconComponent({
  icon,
  className,
  style,
  title
}: {
  icon: IconDefinition;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  return (
    <FontAwesomeIcon
      className={'app-icon ' + (className || '')}
      icon={icon}
      style={style}
      title={title}
    />
  );
}

export default AppIconComponent;
