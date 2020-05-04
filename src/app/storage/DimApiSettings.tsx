import React, { useState } from 'react';
import './storage.scss';
import LocalStorageInfo from './LocalStorageInfo';
import { t } from 'app/i18next-t';
import ImportExport from './ImportExport';
import { apiPermissionGrantedSelector } from 'app/dim-api/selectors';
import { connect } from 'react-redux';
import { RootState, ThunkDispatchProp } from 'app/store/reducers';
import { setApiPermissionGranted } from 'app/dim-api/basic-actions';
import GoogleDriveSettings from './GoogleDriveSettings';
import { SyncService } from './sync.service';
import { dataStats } from './data-stats';
import _ from 'lodash';
import { initSettings } from 'app/settings/settings';
import {
  importLegacyData,
  deleteAllApiData,
  loadDimApiData,
  showBackupDownloadedNotification
} from 'app/dim-api/actions';
import { AppIcon, deleteIcon } from 'app/shell/icons';
import LegacyGoogleDriveSettings from './LegacyGoogleDriveSettings';
import HelpLink from 'app/dim-ui/HelpLink';
import { exportDimApiData } from 'app/dim-api/dim-api';
import { exportBackupData } from './export-data';
import ErrorPanel from 'app/shell/ErrorPanel';
import { Link } from 'react-router-dom';

interface StoreProps {
  apiPermissionGranted: boolean;
  profileLoadedError?: Error;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    apiPermissionGranted: apiPermissionGrantedSelector(state),
    profileLoadedError: state.dimApi.profileLoadedError
  };
}

type Props = StoreProps & ThunkDispatchProp;

const dimApiHelpLink =
  'https://github.com/DestinyItemManager/DIM/wiki/DIM-Sync-(new-storage-for-tags,-loadouts,-and-settings)';

function DimApiSettings({ apiPermissionGranted, dispatch, profileLoadedError }: Props) {
  const [hasBackedUp, setHasBackedUp] = useState(false);

  const onApiPermissionChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const granted = event.target.checked;
    dispatch(setApiPermissionGranted(granted));
    if (granted) {
      // Force a backup of their data just in case
      const data = await SyncService.get();
      exportBackupData(data);
      showBackupDownloadedNotification();
      dispatch(loadDimApiData());
    }
  };

  const onExportData = async () => {
    setHasBackedUp(true);
    const data = await ($featureFlags.dimApi && apiPermissionGranted
      ? exportDimApiData()
      : SyncService.get());
    exportBackupData(data);
  };

  const onImportData = async (data: object) => {
    if ($featureFlags.dimApi && apiPermissionGranted) {
      if (confirm(t('Storage.ImportConfirmDimApi'))) {
        // TODO: At this point the legacy data is definitely out of sync
        await dispatch(importLegacyData(data, true));
        alert(t('Storage.ImportSuccess'));
      }
    } else {
      const stats = dataStats(data);

      const statsLine = _.map(
        stats,
        (value, key) => (value ? t(`Storage.${key}`, { value }) : undefined)
        // t('Storage.LoadoutsD1')
        // t('Storage.LoadoutsD2')
        // t('Storage.TagNotesD1')
        // t('Storage.TagNotesD2')
        // t('Storage.Settings')
        // t('Storage.IgnoredUsers')
      )
        .filter(Boolean)
        .join(', ');

      if (confirm(t('Storage.ImportConfirm', { stats: statsLine }))) {
        // Don't save the `importedToDimApi` flag
        const { importedToDimApi, ...otherData } = data as any;
        await SyncService.set(otherData, true);
        initSettings();
        alert(t('Storage.ImportSuccess'));
      }
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

  // TODO: button to manually sync

  return (
    <section className="storage" id="storage">
      <h2>{t('Storage.MenuTitle')}</h2>

      <div className="setting">
        <div className="horizontal">
          <label htmlFor="apiPermissionGranted">
            {t('Storage.EnableDimApi')} <HelpLink helpLink={dimApiHelpLink} />
          </label>
          <input
            type="checkbox"
            id="apiPermissionGranted"
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
      {$featureFlags.dimApi && apiPermissionGranted && (
        <div className="setting horizontal">
          <label>{t('Storage.AuditLogLabel')}</label>
          <Link to={(location) => `${location.pathname}/audit`} className="dim-button">
            {t('Storage.AuditLog')}
          </Link>
        </div>
      )}
      {$featureFlags.dimApi && (
        <div className="setting horizontal">
          <label>{t('Storage.DeleteAllDataLabel')}</label>
          <button className="dim-button" onClick={deleteAllData}>
            <AppIcon icon={deleteIcon} /> {t('Storage.DeleteAllData')}
          </button>
        </div>
      )}
      {(!$featureFlags.dimApi || !apiPermissionGranted) && <GoogleDriveSettings />}
      <LocalStorageInfo showDetails={!$featureFlags.dimApi || !apiPermissionGranted} />
      <ImportExport onExportData={onExportData} onImportData={onImportData} />
      {$featureFlags.dimApi && apiPermissionGranted && (
        <LegacyGoogleDriveSettings onImportData={onImportData} />
      )}
    </section>
  );
}

export default connect<StoreProps>(mapStateToProps)(DimApiSettings);
