import React from 'react';

import '@fortawesome/fontawesome-free/css/all.css';

import clsx from 'clsx';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

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
        className={clsx(
          icon,
          'app-icon',
          'no-pointer-events',
          className,
          spinning ? 'fa-spin' : false
        )}
        title={title}
      />
    );
  } else {
    return (
      <FontAwesomeIcon
        className={className ? 'app-icon ' + className : 'app-icon'}
        icon={icon}
        title={title}
        spin={spinning}
      />
    );
  }
}

export default React.memo(AppIcon);
