import React from 'react';
import { t } from 'app/i18next-t';
import './storage.scss';
import { StorageAdapter, SyncService } from './sync.service';
import _ from 'lodash';
import { reportException } from '../utils/exceptions';
import { dataStats } from './data-stats';
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
  onImportData(data: object): Promise<any>;
}

interface State {
  driveInfo?: DriveAboutResource;
  adapterStats: {
    [adapterName: string]: { [key: string]: number } | null;
  };
}

class LegacyGoogleDriveSettings extends React.Component<Props, State> {
  state: State = {
    adapterStats: {}
  };
  private subscriptions = new Subscriptions();

  componentDidMount() {
    this.subscriptions.add(
      SyncService.GoogleDriveStorage.signIn$.subscribe(() => {
        if (this.props.location.search.includes('gdrive=true')) {
          this.forceSync(undefined).then(() => this.props.history.replace('/settings'));
        }
        this.updateGoogleDriveInfo();
      }),

      SyncService.GoogleDriveStorage.enabled$.subscribe((enabled) => {
        this.refreshAdapter(SyncService.GoogleDriveStorage);
        if (enabled) {
          this.updateGoogleDriveInfo();
        }
      })
    );

    SyncService.adapters.filter((adapter) => adapter.enabled).forEach(this.refreshAdapter);

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
      <>
        <div className="storage-adapter">
          <h3>{t('Storage.GDriveImport')}</h3>
          <p>{t('Storage.GDriveImportExplain')}</p>
          {googleApiBlocked ? (
            <p className="warning-block">{t('Storage.GoogleApiBlocked')}</p>
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
                  <button className="dim-button" onClick={this.driveLogout}>
                    <AppIcon icon={signOutIcon} /> <span>{t('Storage.DriveLogout')}</span>
                  </button>
                </>
              ) : (
                <button className="dim-button" onClick={this.driveSync}>
                  <AppIcon icon={signInIcon} /> <span>{t('Storage.DriveSync')}</span>
                </button>
              )}{' '}
              <button className="dim-button" onClick={this.importFromLegacy}>
                <AppIcon icon={restoreIcon} /> <span>{t('Storage.GDriveImportButton')}</span>
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  private forceSync = async (e?: any, prompt = true) => {
    e?.preventDefault();
    if (prompt && confirm(t('Storage.ForceSyncWarning'))) {
      const data = await SyncService.get(true);
      await SyncService.set(data, true);
      Promise.all(SyncService.adapters.map(this.refreshAdapter));
    }
    return false;
  };

  private importFromLegacy = async (e?: any) => {
    e?.preventDefault();
    const data = await SyncService.get(true);
    this.props.onImportData(data);
  };

  private driveSync = async (e) => {
    e.preventDefault();
    if (confirm(t('Storage.GDriveSignInWarning'))) {
      try {
        await SyncService.GoogleDriveStorage.authorize();
        await this.forceSync(e, false);
      } catch (e) {
        alert(t('Storage.GDriveSignInError') + e.message);
        reportException('Google Drive Signin', e);
      }
    }
    return null;
  };

  private driveLogout = (e) => {
    e.preventDefault();
    alert(t('Storage.GDriveLogout'));
    return SyncService.GoogleDriveStorage.revokeDrive();
  };

  private refreshAdapter = async (adapter: StorageAdapter) => {
    try {
      if (adapter.enabled) {
        const data = await adapter.get();

        this.setState((state) => {
          const adapterStats = {
            ...state.adapterStats,
            [adapter.name]: data ? dataStats(data) : null
          };
          return {
            adapterStats
          };
        });
        return;
      }
    } catch (e) {
      console.error(e);
    }

    this.setState((state) => {
      const adapterStats = {
        ...state.adapterStats,
        [adapter.name]: null
      };
      return {
        adapterStats
      };
    });
    return;
  };

  private updateGoogleDriveInfo = async () => {
    const driveInfo = await SyncService.GoogleDriveStorage.getDriveInfo();
    this.setState({ driveInfo });
  };
}

export default withRouter(LegacyGoogleDriveSettings);
