import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import cx from 'classnames';

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
      className={cx('app-icon', className, { 'app-icon-spin': spinning })}
      icon={icon}
      style={style}
      title={title}
    />
  );
}

export default AppIconComponent;
