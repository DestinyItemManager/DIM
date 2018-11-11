import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export function AppIconComponent({
  icon,
  className,
  style,
  title,
  spinning
}: {
  icon: IconDefinition;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  spinning?: boolean;
}) {
  return (
    <FontAwesomeIcon
      className={className ? 'app-icon ' + className : 'app-icon'}
      icon={icon}
      style={style}
      title={title}
      spin={spinning}
    />
  );
}

export default AppIconComponent;
