import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import { memo } from 'react';
import './AppIcon.scss';

function AppIcon({
  icon,
  className,
  title,
  spinning,
  ariaHidden,
}: {
  icon: string | IconDefinition;
  className?: string;
  title?: string;
  spinning?: boolean;
  ariaHidden?: boolean;
}) {
  if (typeof icon === 'string') {
    return (
      <span
        className={clsx(icon, 'app-icon', className, spinning ? 'fa-spin' : false)}
        title={title}
        aria-hidden={ariaHidden}
      />
    );
  } else {
    return (
      <FontAwesomeIcon
        className={clsx('app-icon', className)}
        aria-hidden={ariaHidden}
        icon={icon}
        title={title}
        spin={spinning}
      />
    );
  }
}

export default memo(AppIcon);
