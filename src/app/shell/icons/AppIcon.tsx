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
  fading,
}: {
  icon: string | IconDefinition;
  className?: string;
  title?: string;
  spinning?: boolean;
  ariaHidden?: boolean;
  fading?: boolean;
}) {
  if (typeof icon === 'string') {
    return (
      <span
        className={clsx(
          icon,
          'app-icon',
          className,
          spinning ? 'fa-spin' : false,
          fading ? 'fa-fade' : false,
        )}
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
        fade={fading}
      />
    );
  }
}

export default memo(AppIcon);
