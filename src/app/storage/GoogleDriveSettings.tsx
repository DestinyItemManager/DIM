import React from 'react';
import { t } from 'app/i18next-t';
import './storage.scss';
import { StorageAdapter, SyncService } from './sync.service';
import clsx from 'clsx';
import _ from 'lodash';
import { reportException } from '../utils/exceptions';
import { dataStats } from './data-stats';
import {
  AppIcon,
  saveIcon,
  enabledIcon,
  disabledIcon,
  signOutIcon,
  signInIcon,
  restoreIcon
} from '../shell/icons';
import { Subscriptions } from '../utils/rx-utils';
import { DriveAboutResource } from './google-drive-storage';
import { GoogleDriveInfo } from './GoogleDriveInfo';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';

declare global {
  interface Window {
    MSStream: any;
  }
}

interface State {
  driveInfo?: DriveAboutResource;
  adapterStats: {
    [adapterName: string]: { [key: string]: number } | null;
  };
}

class GoogleDriveSettings extends React.Component<RouteComponentProps, State> {
  state: State = {
    adapterStats: {}
  };
  private subscriptions = new Subscriptions();

  componentDidMount() {
    this.subscriptions.add(
      SyncService.GoogleDriveStorage.signIn$.subscribe(() => {
        if (this.props.location.search.includes('gdrive=true')) {
          this.forceSync(undefined, false).then(() => this.props.history.replace('/settings'));
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
    const { driveInfo, adapterStats } = this.state;

    const googleApiBlocked = !window.gapi;

    const adapter = SyncService.GoogleDriveStorage;

    return (
      <>
        <div className="storage-adapter">
          <h2>
            <span>{t('Storage.GoogleDriveStorage')}</span>{' '}
            {/*
                  t('Storage.IndexedDBStorage')
                  t('Storage.GoogleDriveStorage')
                */}
            <span className={clsx('storage-status', { enabled: adapter.enabled })}>
              <AppIcon icon={adapter.enabled ? enabledIcon : disabledIcon} />{' '}
              <span>{adapter.enabled ? t('Storage.Enabled') : t('Storage.Disabled')}</span>
            </span>
          </h2>
          <p>{t('Storage.Details.GoogleDriveStorage')}</p>
          {/*
                t('Storage.Details.GoogleDriveStorage')
                t('Storage.Details.IndexedDBStorage')
              */}
          {googleApiBlocked ? (
            <p className="warning-block">{t('Storage.GoogleApiBlocked')}</p>
          ) : (
            <div>
              {adapter.enabled ? (
                <>
                  {driveInfo && <GoogleDriveInfo driveInfo={driveInfo} />}
                  <button className="dim-button" onClick={this.driveLogout}>
                    <AppIcon icon={signOutIcon} /> <span>{t('Storage.DriveLogout')}</span>
                  </button>{' '}
                  <Link className="dim-button" to="/settings/gdrive-revisions">
                    <AppIcon icon={restoreIcon} /> <span>{t('Storage.GDriveRevisions')}</span>
                  </Link>
                </>
              ) : (
                <button className="dim-button" onClick={this.driveSync}>
                  <AppIcon icon={signInIcon} /> <span>{t('Storage.DriveSync')}</span>
                </button>
              )}
              {adapter.enabled && (
                <button className="dim-button" onClick={this.forceSync}>
                  <AppIcon icon={saveIcon} /> <span>{t('Storage.ForceSync')}</span>
                </button>
              )}
            </div>
          )}
          <p>{t('Storage.StatLabel')}</p>
          <ul>
            {adapterStats[adapter.name] ? (
              _.map(
                adapterStats[adapter.name] || {},
                (value, key) => value > 0 && <li key={key}>{t(`Storage.${key}`, { value })}</li>
              )
            ) : (
              <li>{t('Storage.NoData')}</li>
            )}
          </ul>
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

export default withRouter(GoogleDriveSettings);
