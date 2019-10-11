import React from 'react';
import styles from './NewItemIndicator.m.scss';
import clsx from 'clsx';

export default function NewItemIndicator({ className }: { className?: string }) {
  return <div className={clsx(styles.newItem, className)} />;
}
