import { ExportResponse } from '@destinyitemmanager/dim-api-types';
import { deleteAllApiData, loadDimApiData } from 'app/dim-api/actions';
import { setApiPermissionGranted } from 'app/dim-api/basic-actions';
import { exportDimApiData } from 'app/dim-api/dim-api';
import { importDataBackup } from 'app/dim-api/import';
import { apiPermissionGrantedSelector, dimSyncErrorSelector } from 'app/dim-api/selectors';
import HelpLink from 'app/dim-ui/HelpLink';
import Switch from 'app/dim-ui/Switch';
import { t } from 'app/i18next-t';
import { dimApiHelpLink } from 'app/login/Login';
import { showNotification } from 'app/notifications/notifications';
import ErrorPanel from 'app/shell/ErrorPanel';
import { AppIcon, deleteIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styles from './DimApiSettings.m.scss';
import { exportBackupData, exportLocalData } from './export-data';
import ImportExport from './ImportExport';
import LocalStorageInfo from './LocalStorageInfo';

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
    if (apiPermissionGranted) {
      // Export from the server
      const data = await exportDimApiData();
      exportBackupData(data);
    } else {
      // Export from local data
      const data = await dispatch(exportLocalData());
      exportBackupData(data);
    }
  };

  const onImportData = async (data: ExportResponse) => {
    if (confirm(t('Storage.ImportConfirmDimApi'))) {
      await dispatch(importDataBackup(data));
    }
  };

  const deleteAllData = (e: React.MouseEvent) => {
    e.preventDefault();
    if (apiPermissionGranted && !hasBackedUp) {
      alert(t('Storage.BackUpFirst'));
    } else if (confirm(t('Storage.DeleteAllDataConfirm'))) {
      dispatch(deleteAllApiData());
    }
  };

  return (
    <section className={styles.storage} id="storage">
      <h2>{t('Storage.MenuTitle')}</h2>

      <div className="setting">
        <div className="setting horizontal">
          <label htmlFor="apiPermissionGranted">
            {t('Storage.EnableDimApi')} <HelpLink helpLink={dimApiHelpLink} />
          </label>
          <Switch
            name="apiPermissionGranted"
            checked={apiPermissionGranted}
            onChange={onApiPermissionChange}
          />
        </div>
        <div className="fineprint">{t('Storage.DimApiFinePrint')}</div>
      </div>
      {profileLoadedError && (
        <ErrorPanel title={t('Storage.ProfileErrorTitle')} error={profileLoadedError} />
      )}
      {apiPermissionGranted && (
        <>
          <div className="setting horizontal">
            <label>{t('SearchHistory.Link')}</label>
            <Link to="/search-history" className="dim-button">
              {t('SearchHistory.Title')}
            </Link>
          </div>
          <div className="setting horizontal">
            <label>{t('Storage.DeleteAllDataLabel')}</label>
            <button type="button" className="dim-button" onClick={deleteAllData}>
              <AppIcon icon={deleteIcon} /> {t('Storage.DeleteAllData')}
            </button>
          </div>
        </>
      )}
      <LocalStorageInfo showDetails={!apiPermissionGranted} />
      <ImportExport onExportData={onExportData} onImportData={onImportData} />
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
