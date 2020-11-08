import { addIcon, AppIcon } from 'app/shell/icons';
import clsx from 'clsx';
import React from 'react';
import styles from './Buttons.m.scss';

interface AddButtonProps {
  className?: string;
  onClick(): void;
}

export function AddButton({ className, onClick }: AddButtonProps) {
  return (
    <a className={clsx(styles.add, className)} onClick={onClick}>
      <AppIcon icon={addIcon} />
    </a>
  );
}
