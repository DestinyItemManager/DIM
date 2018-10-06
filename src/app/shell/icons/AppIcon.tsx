import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export default function AppIconComponent({
  icon,
  className,
  style
}: {
  icon: IconDefinition;
  className?: string;
  style?: React.CSSProperties;
}) {
  return <FontAwesomeIcon className={'app-icon ' + (className || '')} icon={icon} style={style} />;
}
