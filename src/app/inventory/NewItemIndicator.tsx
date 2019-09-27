import React from 'react';
import styles from './NewItemIndicator.m.scss';
import classNames from 'classnames';

export default function NewItemIndicator({ className }: { className?: string }) {
  return <div className={classNames(styles.newItem, className)} />;
}
