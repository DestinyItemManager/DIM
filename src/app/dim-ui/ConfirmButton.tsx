import { t } from 'app/i18next-t';
import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import styles from './ConfirmButton.m.scss';

/**
 * a button that requests confirmation, and requires a second
 * click before it runs the provided onClick function
 *
 * this uses a goofy height transition to switch between two
 * different contents (normal content, and confirm message),
 * so please ensure the provided child content is a single line
 */
export function ConfirmButton({
  /** apply "danger" styling, for destructive actions like deletion */
  danger,
  /** this will be executed once the users confirms the action */
  onClick,
  className,
  /** button content. confine this to 1 text line and 1 line-height */
  children,
}: React.PropsWithChildren<{ danger?: boolean; onClick: () => void; className?: string }>) {
  // controls whether the button is in "ask for confirmation" state
  const [confirmMode, setConfirmMode] = useState(false);

  // controls whether the button is ready to submit the requested function
  // (available 100ms after "ask for confirmation" state)
  const [confirmReady, setConfirmReady] = useState(false);

  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const containerRef = useRef<HTMLButtonElement>(null);
  const childrenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContentHeight(childrenRef.current?.offsetHeight || 0);
    setContainerHeight(containerRef.current?.offsetHeight || 0);
  }, []);

  const onClickAction =
    confirmMode && confirmReady
      ? () => {
          setConfirmMode(false);
          setConfirmReady(false);
          onClick();
        }
      : () => {
          setConfirmMode(true);
          setTimeout(() => {
            setConfirmReady(true);
          }, 100);
        };

  return (
    <button
      key="save"
      type="button"
      className={clsx('dim-button', className, styles.confirmButton, {
        [styles.confirmMode]: confirmMode,
        danger,
      })}
      ref={containerRef}
      onClick={onClickAction}
      onMouseLeave={() => {
        setConfirmMode(false);
        setConfirmReady(false);
      }}
      style={{ height: containerHeight || 'auto' }}
    >
      <div style={{ height: confirmMode ? 0 : contentHeight || 'auto' }} ref={childrenRef}>
        {children}
      </div>
      <div style={{ height: confirmMode ? contentHeight : 0 }}>{t('General.Confirm')}</div>
    </button>
  );
}
