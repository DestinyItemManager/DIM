import clsx from 'clsx';
import React from 'react';
import styles from './MaxPowerLoadoutItemIndicator.m.scss';

export default function MaxPowerLoadoutItemIndicator({
  className,
  alwaysShow = false,
}: {
  className?: string;
  alwaysShow?: boolean;
}) {
  return (
    <div
      className={clsx(styles.maxPowerLoadoutItem, className, { [styles.alwaysShow]: alwaysShow })}
    />
  );
}
