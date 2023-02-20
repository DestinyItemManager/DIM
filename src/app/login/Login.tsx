import CheckButton from 'app/dim-ui/CheckButton';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import { exportBackupData, exportLocalData } from 'app/storage/export-data';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { oauthClientId } from '../bungie-api/bungie-api-utils';
import styles from './Login.m.scss';

export const dimApiHelpLink = 'https://github.com/DestinyItemManager/DIM/wiki/DIM-Sync';
const loginHelpLink = 'https://github.com/DestinyItemManager/DIM/wiki/Accounts-and-Login';

export default function Login() {
  const dispatch = useThunkDispatch();
  const authorizationState = useMemo(
    () => (navigator.userAgent.includes('DIM AppStore') ? 'dimauth-' : '') + uuidv4(),
    []
  );
  const clientId = oauthClientId();
  const { state } = useLocation();
  const previousPath = state?.path;

  useEffect(() => {
    localStorage.setItem('authorizationState', authorizationState);
  }, [authorizationState]);

  // Save the path we were originally on, so we can restore it after login in the DefaultAccount component.
  useEffect(() => {
    if (previousPath) {
      localStorage.setItem('returnPath', previousPath);
    }
  }, [previousPath]);

  const authorizationURL = (reauth?: string) => {
    const queryParams = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      state: authorizationState,
      ...(reauth && { reauth }),
    });
    return `https://www.bungie.net/en/OAuth/Authorize?${queryParams}`;
  };

  // If API permissions had been explicitly disabled before, don't even show the option to enable DIM Sync
  const [apiPermissionPreviouslyDisabled] = useState(
    localStorage.getItem('dim-api-enabled') === 'false'
  );
  const [apiPermissionGranted, setApiPermissionGranted] = useState(() => {
    const enabled = localStorage.getItem('dim-api-enabled') !== 'false';
    localStorage.setItem('dim-api-enabled', JSON.stringify(enabled));
    return enabled;
  });

  // Don't let people leave the page without a backup if they're enabling DIM Sync after having it disabled
  const [hasBackedUp, setHasBackedUp] = useState(false);
  const onLoginClick = (e: React.MouseEvent) => {
    if (
      apiPermissionPreviouslyDisabled &&
      apiPermissionGranted &&
      !hasBackedUp &&
      !confirm(t('Views.Login.BackupPrompt'))
    ) {
      e.preventDefault();
    }
  };

  const onApiPermissionChange = (checked: boolean) => {
    localStorage.setItem('dim-api-enabled', JSON.stringify(checked));
    setApiPermissionGranted(checked);
  };

  const onExportData = async () => {
    // Export from local data
    const data = await dispatch(exportLocalData());
    exportBackupData(data);
    setHasBackedUp(true);
  };

  return (
    <div className={styles.billboard}>
      <h1>{t('Views.Login.Permission')}</h1>
      <p className={styles.explanation}>{t('Views.Login.Explanation')}</p>
      <p>
        <a
          rel="noopener noreferrer"
          onClick={onLoginClick}
          className={styles.auth}
          href={authorizationURL()}
        >
          {t('Views.Login.Auth')}
        </a>
      </p>
      <div>
        <a
          className="dim-button"
          rel="noopener noreferrer"
          onClick={onLoginClick}
          href={authorizationURL('true')}
        >
          {t('Views.Login.NewAccount')}
        </a>
      </div>
      <section className={styles.dimSync}>
        <CheckButton
          name="apiPermissionGranted"
          className={styles.dimSyncCheckbox}
          checked={apiPermissionGranted}
          onChange={onApiPermissionChange}
        >
          {t('Storage.EnableDimApi')}
        </CheckButton>
        <div className={styles.fineprint}>
          {t('Storage.DimApiFinePrint')}{' '}
          <ExternalLink href={dimApiHelpLink}>{t('Storage.LearnMore')}</ExternalLink>
        </div>
        {apiPermissionPreviouslyDisabled && apiPermissionGranted && (
          <div className={styles.warning}>
            {t('Views.Login.EnableDimSyncWarning')}
            <button type="button" className="dim-button" onClick={onExportData}>
              {t('Storage.Export')}
            </button>
          </div>
        )}
        {!apiPermissionPreviouslyDisabled && !apiPermissionGranted && (
          <div className={styles.warning}>
            If DIM Sync is disabled, you may lose your data, for example when you clear your browser
            cache. Please make frequent backups or enable DIM Sync.
          </div>
        )}
      </section>
      <section className={styles.section}>
        <ExternalLink href={loginHelpLink}>{t('Views.Login.LearnMore')}</ExternalLink> |{' '}
        <Link to="/privacy">Privacy Policy</Link>
      </section>
    </div>
  );
}
