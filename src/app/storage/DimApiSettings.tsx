import { ExportResponse } from '@destinyitemmanager/dim-api-types';
import { deleteAllApiData, loadDimApiData } from 'app/dim-api/actions';
import { setApiPermissionGranted } from 'app/dim-api/basic-actions';
import { exportDimApiData } from 'app/dim-api/dim-api';
import { importDataBackup } from 'app/dim-api/import';
import { apiPermissionGrantedSelector, dimSyncErrorSelector } from 'app/dim-api/selectors';
import HelpLink from 'app/dim-ui/HelpLink';
import useConfirm from 'app/dim-ui/useConfirm';
import { t } from 'app/i18next-t';
import { dimApiHelpLink } from 'app/login/Login';
import { showNotification } from 'app/notifications/notifications';
import Checkbox from 'app/settings/Checkbox';
import { fineprintClass, horizontalClass, settingClass } from 'app/settings/SettingsPage';
import { Settings } from 'app/settings/initial-settings';
import ErrorPanel from 'app/shell/ErrorPanel';
import { AppIcon, deleteIcon, refreshIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { errorMessage } from 'app/utils/errors';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router';
import * as styles from './DimApiSettings.m.scss';
import ImportExport from './ImportExport';
import LocalStorageInfo from './LocalStorageInfo';
import { exportBackupData, exportLocalData } from './export-data';

export default function DimApiSettings() {
  const dispatch = useThunkDispatch();
  const apiPermissionGranted = useSelector(apiPermissionGrantedSelector);
  const profileLoadedError = useSelector(dimSyncErrorSelector);
  const [hasBackedUp, setHasBackedUp] = useState(false);

  const onApiPermissionChange = async (checked: boolean) => {
    const granted = checked;
    dispatch(setApiPermissionGranted(granted));
    if (granted) {
      const data = await dispatch(exportLocalData());
      // Force a backup of their data just in case
      exportBackupData(data);
      showBackupDownloadedNotification();
      dispatch(loadDimApiData());
    } else {
      // Reset the warning about data not being saved
      localStorage.removeItem('warned-no-sync');
    }
  };

  const onExportData = async () => {
    setHasBackedUp(true);
    let data: ExportResponse;
    if (apiPermissionGranted) {
      // Export from the server
      try {
        data = await exportDimApiData();
      } catch (e) {
        showNotification({
          type: 'error',
          title: t('Storage.ExportError'),
          body: t('Storage.ExportErrorBody', { error: errorMessage(e) }),
          duration: 15000,
        });
        data = await dispatch(exportLocalData());
      }
    } else {
      // Export from local data
      data = await dispatch(exportLocalData());
    }
    exportBackupData(data);
  };

  const [confirmDialog, confirm] = useConfirm();
  const onImportData = async (data: ExportResponse) => {
    if (await confirm(t('Storage.ImportConfirmDimApi'))) {
      await dispatch(importDataBackup(data));
    }
  };

  const deleteAllData = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (apiPermissionGranted && !hasBackedUp) {
      showNotification({ type: 'warning', title: t('Storage.BackUpFirst') });
    } else if (await confirm(t('Storage.DeleteAllDataConfirm'))) {
      dispatch(deleteAllApiData());
    }
  };

  const refreshDimSync = async () => {
    await dispatch(loadDimApiData({ forceLoad: true }));
  };

  return (
    <section className={styles.storage} id="storage">
      {confirmDialog}
      <h2>{t('Storage.MenuTitle')}</h2>

      <div className={settingClass}>
        <Checkbox
          name={'apiPermissionGranted' as keyof Settings}
          label={
            <>
              {t('Storage.EnableDimApi')} <HelpLink helpLink={dimApiHelpLink} />
            </>
          }
          value={apiPermissionGranted}
          onChange={onApiPermissionChange}
        />
        <div className={fineprintClass}>{t('Storage.DimApiFinePrint')}</div>
        {apiPermissionGranted && (
          <>
            <button type="button" className="dim-button" onClick={refreshDimSync}>
              <AppIcon icon={refreshIcon} /> {t('Storage.RefreshDimSync')}
            </button>
            <button type="button" className="dim-button" onClick={deleteAllData}>
              <AppIcon icon={deleteIcon} /> {t('Storage.DeleteAllData')}
            </button>
          </>
        )}
      </div>
      {profileLoadedError && (
        <ErrorPanel title={t('Storage.ProfileErrorTitle')} error={profileLoadedError} />
      )}
      {apiPermissionGranted && (
        <div className={settingClass}>
          <div className={horizontalClass}>
            <label>{t('SearchHistory.Link')}</label>
            <Link to="/search-history" className="dim-button">
              {t('SearchHistory.Title')}
            </Link>
          </div>
        </div>
      )}
      <LocalStorageInfo showDetails={!apiPermissionGranted} className={settingClass} />
      <div className={settingClass}>
        <ImportExport onExportData={onExportData} onImportData={onImportData} />
      </div>
    </section>
  );
}

// TODO: gotta change all these strings
function showBackupDownloadedNotification() {
  showNotification({
    type: 'success',
    title: t('Storage.DimSyncEnabled'),
    body: t('Storage.AutoBackup'),
    duration: 15000,
  });
}
