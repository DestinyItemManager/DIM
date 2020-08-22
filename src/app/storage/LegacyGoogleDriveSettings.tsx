import React from 'react';
import { t } from 'app/i18next-t';
import './storage.scss';
import { SyncService, DimData } from './sync.service';
import _ from 'lodash';
import { reportException } from '../utils/exceptions';
import { AppIcon, signOutIcon, signInIcon, restoreIcon } from '../shell/icons';
import { Subscriptions } from '../utils/rx-utils';
import { DriveAboutResource } from './google-drive-storage';
import { RouteComponentProps, withRouter } from 'react-router';

declare global {
  interface Window {
    MSStream: any;
  }
}

interface Props extends RouteComponentProps {
  onImportData(data: DimData): Promise<any>;
}

interface State {
  driveInfo?: DriveAboutResource;
}

/**
 * Settings to import old data from Google Drive or pre-DIM-Sync local storage.
 */
class LegacyGoogleDriveSettings extends React.Component<Props, State> {
  state: State = {};
  private subscriptions = new Subscriptions();

  componentDidMount() {
    // Start up the old sync service for imports
    SyncService.init();

    this.subscriptions.add(
      SyncService.GoogleDriveStorage.signIn$.subscribe(() => {
        this.updateGoogleDriveInfo();
      }),

      SyncService.GoogleDriveStorage.enabled$.subscribe((enabled) => {
        if (enabled) {
          this.updateGoogleDriveInfo();
        }
      })
    );

    if (SyncService.GoogleDriveStorage.enabled) {
      this.updateGoogleDriveInfo();
    }
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { driveInfo } = this.state;

    const googleApiBlocked = !window.gapi;

    const adapter = SyncService.GoogleDriveStorage;

    return (
      <div className="storage-adapter">
        <h3>{t('Storage.GDriveImport')}</h3>
        <p>{t('Storage.GDriveImportExplain')}</p>
        {googleApiBlocked ? (
          <p>{t('Storage.GoogleApiBlocked')}</p>
        ) : (
          <div>
            {adapter.enabled ? (
              <>
                {driveInfo && (
                  <div className="google-user">
                    {driveInfo.user.emailAddress && (
                      <div>
                        {t('Storage.GDriveSignedIn', { email: driveInfo.user.emailAddress })}
                      </div>
                    )}
                  </div>
                )}
                <button type="button" className="dim-button" onClick={this.driveLogout}>
                  <AppIcon icon={signOutIcon} /> <span>{t('Storage.DriveLogout')}</span>
                </button>
              </>
            ) : (
              <button type="button" className="dim-button" onClick={this.driveSync}>
                <AppIcon icon={signInIcon} /> <span>{t('Storage.DriveSync')}</span>
              </button>
            )}{' '}
            <button type="button" className="dim-button" onClick={this.importFromLegacy}>
              <AppIcon icon={restoreIcon} /> <span>{t('Storage.GDriveImportButton')}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  private importFromLegacy = async (e?: any) => {
    e?.preventDefault();
    const data = await SyncService.get();
    this.props.onImportData(data);
  };

  private driveSync = async (e) => {
    e.preventDefault();
    try {
      await SyncService.GoogleDriveStorage.authorize();
    } catch (e) {
      alert(t('Storage.GDriveSignInError') + e.message);
      reportException('Google Drive Signin', e);
    }
    return null;
  };

  private driveLogout = (e) => {
    e.preventDefault();
    return SyncService.GoogleDriveStorage.revokeDrive();
  };

  private updateGoogleDriveInfo = async () => {
    const driveInfo = await SyncService.GoogleDriveStorage.getDriveInfo();
    this.setState({ driveInfo });
  };
}

export default withRouter(LegacyGoogleDriveSettings);
