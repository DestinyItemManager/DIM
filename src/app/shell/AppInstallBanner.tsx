import { t } from 'app/i18next-t';
import { useLocalStorage } from 'app/utils/hooks';
import React from 'react';
import styles from './AppInstallBanner.m.scss';
import { AppIcon, closeIcon } from './icons';

const DAY = 1000 * 60 * 60 * 24;

/** Shows a banner in the header on mobile asking the user to install */
export default function AppInstallBanner({ onClick }: { onClick: React.MouseEventHandler }) {
  const [lastDismissed, setLastDismissed] = useLocalStorage<number>(
    'app-install-last-dismissed',
    0,
  );

  // Hide if they've dismissed this in the last 2 weeks
  if (Date.now() - lastDismissed < 14 * DAY) {
    return null;
  }

  const hide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLastDismissed(Date.now());
  };

  return (
    <a className={styles.banner} onClick={onClick}>
      <span>{t('Header.InstallDIMBanner')}</span>
      <button type="button" className={styles.hideButton} onClick={hide}>
        <AppIcon icon={closeIcon} />
      </button>
    </a>
  );
}
