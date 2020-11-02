import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

function AppIcon({
  icon,
  className,
  title,
  spinning,
}: {
  icon: IconDefinition;
  className?: string;
  title?: string;
  spinning?: boolean;
}) {
  return (
    <FontAwesomeIcon
      className={className ? 'app-icon ' + className : 'app-icon'}
      icon={icon}
      title={title}
      spin={spinning}
    />
  );
}

export default React.memo(AppIcon);
