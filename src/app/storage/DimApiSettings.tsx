import React, { useState } from 'react';
import './storage.scss';
import LocalStorageInfo from './LocalStorageInfo';
import { t } from 'app/i18next-t';
import ImportExport from './ImportExport';
import { apiPermissionGrantedSelector } from 'app/dim-api/selectors';
import { connect } from 'react-redux';
import { RootState, ThunkDispatchProp, ThunkResult } from 'app/store/types';
import { setApiPermissionGranted } from 'app/dim-api/basic-actions';
import _ from 'lodash';
import { deleteAllApiData, loadDimApiData } from 'app/dim-api/actions';
import { AppIcon, deleteIcon } from 'app/shell/icons';
import LegacyGoogleDriveSettings from './LegacyGoogleDriveSettings';
import HelpLink from 'app/dim-ui/HelpLink';
import { exportDimApiData } from 'app/dim-api/dim-api';
import { exportBackupData } from './export-data';
import ErrorPanel from 'app/shell/ErrorPanel';
import { Link } from 'react-router-dom';
import { ExportResponse, DestinyVersion } from '@destinyitemmanager/dim-api-types';
import { parseProfileKey } from 'app/dim-api/reducer';
import { importDataBackup } from 'app/dim-api/import';
import { showNotification } from 'app/notifications/notifications';
import { DimData } from './sync.service';

interface StoreProps {
  apiPermissionGranted: boolean;
  profileLoadedError?: Error;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    apiPermissionGranted: apiPermissionGrantedSelector(state),
    profileLoadedError: state.dimApi.profileLoadedError,
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
      const data = await dispatch(exportLocalData());
      // Force a backup of their data just in case
      exportBackupData(data);
      showBackupDownloadedNotification();
      dispatch(loadDimApiData());
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

  const onImportData = async (data: DimData | ExportResponse) => {
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
      {apiPermissionGranted && (
        <div className="setting horizontal">
          <label>{t('Storage.AuditLogLabel')}</label>
          <Link to={(location) => `${location.pathname}/audit`} className="dim-button">
            {t('Storage.AuditLog')}
          </Link>
        </div>
      )}
      {apiPermissionGranted && (
        <div className="setting horizontal">
          <label>{t('Storage.DeleteAllDataLabel')}</label>
          <button type="button" className="dim-button" onClick={deleteAllData}>
            <AppIcon icon={deleteIcon} /> {t('Storage.DeleteAllData')}
          </button>
        </div>
      )}
      <LocalStorageInfo showDetails={!apiPermissionGranted} />
      <ImportExport onExportData={onExportData} onImportData={onImportData} />
      <LegacyGoogleDriveSettings onImportData={onImportData} />
    </section>
  );
}

export default connect<StoreProps>(mapStateToProps)(DimApiSettings);

/**
 * Export the local IDB data to a format the DIM API could import.
 */
function exportLocalData(): ThunkResult<ExportResponse> {
  return async (_, getState) => {
    const dimApiState = getState().dimApi;
    const exportResponse: ExportResponse = {
      settings: dimApiState.settings,
      loadouts: [],
      tags: [],
      triumphs: [],
      itemHashTags: [],
      searches: [],
    };

    for (const profileKey in dimApiState.profiles) {
      if (Object.prototype.hasOwnProperty.call(dimApiState.profiles, profileKey)) {
        const [platformMembershipId, destinyVersion] = parseProfileKey(profileKey);

        for (const loadout of Object.values(dimApiState.profiles[profileKey].loadouts)) {
          exportResponse.loadouts.push({
            loadout,
            platformMembershipId,
            destinyVersion,
          });
        }
        for (const annotation of Object.values(dimApiState.profiles[profileKey].tags)) {
          exportResponse.tags.push({
            annotation,
            platformMembershipId,
            destinyVersion,
          });
        }

        exportResponse.triumphs.push({
          platformMembershipId,
          triumphs: dimApiState.profiles[profileKey].triumphs,
        });
      }
    }

    exportResponse.itemHashTags = Object.values(dimApiState.itemHashTags);

    for (const destinyVersion in dimApiState.searches) {
      for (const search of dimApiState.searches[destinyVersion]) {
        exportResponse.searches.push({
          destinyVersion: parseInt(destinyVersion, 10) as DestinyVersion,
          search,
        });
      }
    }

    return exportResponse;
  };
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
