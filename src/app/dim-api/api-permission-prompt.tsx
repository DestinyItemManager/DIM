import { t } from 'app/i18next-t';
import NotificationButton from 'app/notifications/NotificationButton';
import { showNotification } from 'app/notifications/notifications';
import { AppIcon, faCheck } from 'app/shell/icons';
import React from 'react';
import * as styles from './api-permission-prompt.m.scss';

/**
 * This asks the user if they want to use DIM Sync. It will stay up until a choice is made.
 * If the user chooses to enable sync, this also kicks off an immediate backup of legacy data.
 */
export function promptForApiPermission() {
  let returnValue: (result: boolean) => void;
  const promise = new Promise<boolean>((resolve) => {
    returnValue = resolve;
  });

  const ok = async (e: React.MouseEvent) => {
    e.preventDefault();
    returnValue(true);
  };

  const no = (e: React.MouseEvent) => {
    e.preventDefault();
    returnValue(false);
  };

  showNotification({
    type: 'success',
    onClick: () => false,
    promise,
    duration: 0, // close immediately on click
    title: t('Storage.ApiPermissionPrompt.Title'),
    body: (
      <>
        <div>{t('Storage.ApiPermissionPrompt.Description')}</div>
        <div className={styles.buttons}>
          <NotificationButton onClick={ok}>
            <AppIcon icon={faCheck} /> {t('Storage.ApiPermissionPrompt.Yes')}
          </NotificationButton>
          <NotificationButton onClick={no}>
            {t('Storage.ApiPermissionPrompt.No')}
          </NotificationButton>
        </div>
      </>
    ),
  });

  return promise;
}
