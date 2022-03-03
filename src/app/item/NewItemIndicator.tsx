import clsx from 'clsx';
import React from 'react';
import styles from './NewItemIndicator.m.scss';

export default function NewItemIndicator({
  className,
  alwaysShow = false,
}: {
  className?: string;
  alwaysShow?: boolean;
}) {
  return <div className={clsx(styles.newItem, className, { [styles.alwaysShow]: alwaysShow })} />;
}
