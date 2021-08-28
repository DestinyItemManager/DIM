import React from 'react';
import styles from './CloseButton.m.scss';

/** A generic "close" or "delete" button, usually placed in the upper right corner of an item tile. */
export default function CloseButton({ onClick }: { onClick(e: React.MouseEvent): void }) {
  return <div className={styles.close} onClick={onClick} role="button" tabIndex={0} />;
}
