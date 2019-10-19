import React from 'react';
import clsx from 'clsx';
import styles from './ItemActionButton.m.scss';

export function ItemActionButtonGroup({ children }: { children: React.ReactNode }) {
  return <div className={styles.locations}>{children}</div>;
}

/**
 * Buttons for the ItemActions component. These show the applicable
 * actions for the given store to move/equip the given item.
 */
export default function ItemActionButton({
  title,
  label,
  icon,
  className,
  onClick
}: {
  title: string;
  label: string;
  icon?: string;
  className?: string;
  onClick(): void;
}) {
  return (
    <div
      className={clsx(styles.button, className)}
      title={title}
      onClick={onClick}
      style={icon ? { backgroundImage: `url(${icon})` } : undefined}
    >
      <span>{label}</span>
    </div>
  );
}
