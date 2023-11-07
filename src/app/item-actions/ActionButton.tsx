import { symbolize } from 'app/hotkeys/hotkeys';
import React from 'react';
import styles from './ActionButton.m.scss';

export default function ActionButton({
  disabled,
  title,
  hotkey,
  hotkeyDescription,
  children,
  onClick,
}: {
  title?: string;
  disabled?: boolean;
  hotkey?: string;
  hotkeyDescription?: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.actionButton}
      onClick={onClick}
      title={
        title || hotkeyDescription
          ? (title ?? hotkeyDescription) + (hotkey ? ` [${symbolize(hotkey)}]` : '')
          : undefined
      }
      disabled={disabled}
      aria-keyshortcuts={hotkey}
    >
      {children}
    </button>
  );
}
