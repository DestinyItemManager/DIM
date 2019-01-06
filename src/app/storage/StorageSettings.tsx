import * as React from 'react';
import { t } from 'i18next';
import './storage.scss';
import { clearIgnoredUsers } from '../destinyTrackerApi/userFilter';
import { StorageAdapter, SyncService } from './sync.service';
import { router } from '../../router';
import { percent } from '../inventory/dimPercentWidth.directive';
import classNames from 'classnames';
import * as _ from 'lodash';
import { reportException } from '../exceptions';
import { dataStats } from './data-stats';
import {
  AppIcon,
  saveIcon,
  clearIcon,
  enabledIcon,
  disabledIcon,
  signOutIcon,
  uploadIcon,
  signInIcon,
  downloadIcon
} from '../shell/icons';
import { Subscriptions } from '../rx-utils';
import { initSettings } from '../settings/settings';
import { dimLoadoutService } from '../loadout/loadout.service';
import { DriveAboutResource } from './google-drive-storage';
import { GoogleDriveInfo } from './GoogleDriveInfo';
import { DropFilesEventHandler } from 'react-dropzone';
import FileUpload from '../dim-ui/FileUpload';

declare global {
  interface Window {
    MSStream: any;
  }
}

const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const supportsExport = !iOS;
const canClearIgnoredUsers = $DIM_FLAVOR === 'dev';

interface State {
  quota?: { quota: number; usage: number };
  driveInfo?: DriveAboutResource;
  browserMayClearData: boolean;
  adapterStats: {
    [adapterName: string]: { [key: string]: number } | null;
  };
}

export default class StorageSettings extends React.Component<{}, State> {
  state: State = {
    browserMayClearData: true,
    adapterStats: {}
  };
  private subscriptions = new Subscriptions();

  componentDidMount() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((quota: { quota: number; usage: number }) => {
        if (quota.usage >= 0 && quota.quota >= 0) {
          this.setState({ quota });
        }
      });
    }
    if ('storage' in navigator && 'persist' in navigator.storage) {
      navigator.storage.persisted().then((persistent) => {
        this.setState({ browserMayClearData: !persistent });
      });
    }
    this.subscriptions.add(
      SyncService.GoogleDriveStorage.signIn$.subscribe(() => {
        if (router.globals.params.gdrive === 'true') {
          this.forceSync(undefined, false).then(() =>
            router.stateService.go('settings', { gdrive: undefined }, { location: 'replace' })
          );
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
    const { quota, driveInfo, browserMayClearData, adapterStats } = this.state;

    const googleApiBlocked = !window.gapi;

    return (
      <div className="storage">
        <h2>{t('Storage.Title')}</h2>

        <section>
          <p>{t('Storage.Explain')}</p>
          {SyncService.GoogleDriveStorage.enabled && (
            <button className="dim-button" onClick={this.forceSync}>
              <AppIcon icon={saveIcon} /> <span>{t('Storage.ForceSync')}</span>
            </button>
          )}{' '}
          {canClearIgnoredUsers && (
            <button className="dim-button" onClick={this.clearIgnoredUsers}>
              <AppIcon icon={clearIcon} /> <span>{t('Storage.ClearIgnoredUsers')}</span>
            </button>
          )}
          {SyncService.adapters.map((adapter) => (
            <div key={adapter.name} className="storage-adapter">
              <h2>
                <span>{t(`Storage.${adapter.name}`)}</span>{' '}
                <span className={classNames('storage-status', { enabled: adapter.enabled })}>
                  <AppIcon icon={adapter.enabled ? enabledIcon : disabledIcon} />{' '}
                  <span>{t(`Storage.${adapter.enabled ? 'Enabled' : 'Disabled'}`)}</span>
                </span>
              </h2>
              <p>{t(`Storage.Details.${adapter.name}`)}</p>
              {adapter.name === 'GoogleDriveStorage' &&
                (googleApiBlocked ? (
                  <p className="warning-block">{t('Storage.GoogleApiBlocked')}</p>
                ) : (
                  <div>
                    {adapter.enabled ? (
                      <>
                        {driveInfo && <GoogleDriveInfo driveInfo={driveInfo} />}
                        <button className="dim-button" onClick={this.driveLogout}>
                          <AppIcon icon={signOutIcon} /> <span>{t('Storage.DriveLogout')}</span>
                        </button>{' '}
                        <button className="dim-button" onClick={this.goToRevisions}>
                          <AppIcon icon={uploadIcon} /> <span>{t('Storage.GDriveRevisions')}</span>
                        </button>
                      </>
                    ) : (
                      <button className="dim-button" onClick={this.driveSync}>
                        <AppIcon icon={signInIcon} /> <span>{t('Storage.DriveSync')}</span>
                      </button>
                    )}
                  </div>
                ))}
              {adapter.name === 'IndexedDBStorage' && browserMayClearData && (
                <p className="warning-block">{t('Storage.BrowserMayClearData')}</p>
              )}
              {adapter.name === 'IndexedDBStorage' && quota && (
                <div>
                  <div className="storage-guage">
                    <div
                      className={classNames({
                        full: quota.usage / quota.quota > 0.9
                      })}
                      style={{ width: percent(quota.usage / quota.quota) }}
                    />
                  </div>
                  <p>{t('Storage.Usage', quota)}</p>
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
          ))}
          {supportsExport && (
            <div className="storage-adapter">
              <h2>{t('Storage.ImportExport')}</h2>
              <p>
                <button className="dim-button" onClick={this.exportData}>
                  <AppIcon icon={downloadIcon} /> {t('Storage.Export')}
                </button>
              </p>
              <FileUpload onDrop={this.importData} accept=".json" title={t('Storage.Import')} />
              <p />
            </div>
          )}
        </section>
      </div>
    );
  }

  private forceSync = async (e?: any, prompt = true) => {
    e && e.preventDefault();
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
    return false;
  };

  private exportData = (e) => {
    e.preventDefault();
    // Function to download data to a file
    function download(data, filename, type) {
      const a = document.createElement('a');
      const file = new Blob([data], { type });
      const url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
    }

    SyncService.get().then((data) => {
      download(JSON.stringify(data), 'dim-data.json', 'application/json');
    });
    return false;
  };

  private goToRevisions = (e) => {
    e.preventDefault();
    router.stateService.go('gdrive-revisions');
    return false;
  };

  private importData: DropFilesEventHandler = (acceptedFiles) => {
    if (acceptedFiles.length < 1) {
      alert(t('Storage.ImportWrongFileType'));
      return;
    }
    if (acceptedFiles.length > 1) {
      alert(t('Storage.ImportTooManyFiles'));
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (reader.result && typeof reader.result === 'string') {
        try {
          const data = JSON.parse(reader.result);

          const stats = dataStats(data);

          const statsLine = _.map(stats, (value, key) =>
            value ? t(`Storage.${key}`, { value }) : undefined
          )
            .filter(Boolean)
            .join(', ');

          if (confirm(t('Storage.ImportConfirm', { stats: statsLine }))) {
            await SyncService.set(data, true);
            await Promise.all(SyncService.adapters.map(this.refreshAdapter));
            initSettings();
            dimLoadoutService.getLoadouts(true);
            alert(t('Storage.ImportSuccess'));
          }
        } catch (e) {
          alert(t('Storage.ImportFailed', { error: e.message }));
        }
      }
    };

    const file = acceptedFiles[0];
    if (file) {
      reader.readAsText(file);
    } else {
      alert(t('Storage.ImportNoFile'));
    }
    return false;
  };

  private clearIgnoredUsers = (e) => {
    e.preventDefault();
    if (!canClearIgnoredUsers) {
      return;
    }

    clearIgnoredUsers();
    return false;
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
