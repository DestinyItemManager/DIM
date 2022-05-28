import '@fortawesome/fontawesome-free/css/all.css';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import React from 'react';

function AppIcon({
  icon,
  className,
  title,
  spinning,
}: {
  icon: string | IconDefinition;
  className?: string;
  title?: string;
  spinning?: boolean;
}) {
  if (typeof icon === 'string') {
    return (
      <span
        className={clsx(icon, 'app-icon', className, spinning ? 'fa-spin' : false)}
        title={title}
      />
    );
  } else {
    return (
      <FontAwesomeIcon
        className={clsx('app-icon', className)}
        icon={icon}
        title={title}
        spin={spinning}
      />
    );
  }
}

export default React.memo(AppIcon);
