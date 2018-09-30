import * as React from 'react';
import { t } from 'i18next';
import './storage.scss';
import { clearIgnoredUsers } from '../destinyTrackerApi/userFilter';
import { StorageAdapter, SyncService } from './sync.service';
import { router } from '../../router';
import { $rootScope } from 'ngimport';
import { percent } from '../inventory/dimPercentWidth.directive';
import classNames from 'classnames';
import * as _ from 'underscore';
import { reportException } from '../exceptions';
import { dataStats } from './data-stats';

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
  private $scope = $rootScope.$new(true);
  private fileInput = React.createRef<HTMLInputElement>();

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
    // TODO: observable?
    this.$scope.$on('gdrive-sign-in', () => {
      if (router.globals.params.gdrive === 'true') {
        this.forceSync().then(() =>
          router.stateService.go('settings', { gdrive: undefined }, { location: 'replace' })
        );
      }
    });
    // TODO: problematic
    SyncService.adapters.forEach((adapter) => {
      this.$scope.$watch(
        () => adapter.enabled,
        () => {
          this.refreshAdapter(adapter);
        }
      );
    });
  }

  componentWillUnmount() {
    this.$scope.$destroy();
  }

  render() {
    const { quota, browserMayClearData, adapterStats } = this.state;

    const googleApiBlocked = !window.gapi;

    return (
      <div className="storage">
        <h2>{t('Storage.Title')}</h2>

        <section>
          <p>{t('Storage.Explain')}</p>
          <button className="dim-button" onClick={this.forceSync}>
            <i className="fa fa-save" />
            <span>{t('Storage.ForceSync')}</span>
          </button>{' '}
          {canClearIgnoredUsers && (
            <button className="dim-button" onClick={this.clearIgnoredUsers}>
              <i className="fa fa-eraser" />
              <span>{t('Storage.ClearIgnoredUsers')}</span>
            </button>
          )}
          {quota && (
            <div className="storage-adapter">
              <div className="storage-guage">
                <div style={{ width: percent(quota.usage / quota.quota) }} />
              </div>
              <p>{t('Storage.Usage', quota)}</p>
            </div>
          )}
          {SyncService.adapters.map((adapter) => (
            <div key={adapter.name} className="storage-adapter">
              <h2>
                <span>{t(`Storage.${adapter.name}`)}</span>{' '}
                <span className={classNames('storage-status', { enabled: adapter.enabled })}>
                  <i
                    className={classNames(
                      'fa',
                      adapter.enabled ? 'fa-check-circle-o' : 'fa-times-circle-o'
                    )}
                  />
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
                        <button className="dim-button" onClick={this.driveLogout}>
                          <i className="fa fa-sign-out" />
                          <span>{t('Storage.DriveLogout')}</span>
                        </button>{' '}
                        <button className="dim-button" onClick={this.goToRevisions}>
                          <i className="fa fa-upload" />
                          <span>{t('Storage.GDriveRevisions')}</span>
                        </button>
                      </>
                    ) : (
                      <button className="dim-button" onClick={this.driveSync}>
                        <i className="fa fa-sign-in" />
                        <span>{t('Storage.DriveSync')}</span>
                      </button>
                    )}
                  </div>
                ))}

              {adapter.name === 'IndexedDBStorage' &&
                browserMayClearData && (
                  <p className="warning-block">{t('Storage.BrowserMayClearData')}</p>
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
                  <i className="fa fa-download" />
                  <span>{t('Storage.Export')}</span>
                </button>
              </p>
              <p>
                <button className="dim-button" onClick={this.importData}>
                  <i className="fa fa-upload" />
                  <span>{t('Storage.Import')}</span>
                </button>
                <input type="file" id="importFile" ref={this.fileInput} />
              </p>
            </div>
          )}
        </section>
      </div>
    );
  }

  private forceSync = async () => {
    const data = await SyncService.get(true);
    await SyncService.set(data, true);
    return Promise.all(SyncService.adapters.map(this.refreshAdapter));
  };

  private driveSync = async () => {
    if (confirm(t('Storage.GDriveSignInWarning'))) {
      try {
        await SyncService.GoogleDriveStorage.authorize();
        await this.forceSync();
      } catch (e) {
        alert(t('Storage.GDriveSignInError') + e.message);
        reportException('Google Drive Signin', e);
      }
    }
    return null;
  };

  private driveLogout = () => {
    alert(t('Storage.GDriveLogout'));
    return SyncService.GoogleDriveStorage.revokeDrive();
  };

  private exportData = () => {
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
  };

  private goToRevisions = () => {
    router.stateService.go('gdrive-revisions');
    return false;
  };

  private importData = () => {
    const reader = new FileReader();
    reader.onload = () => {
      // TODO: we're kinda trusting that this is the right data here, no validation!
      if (reader.result && typeof reader.result === 'string') {
        SyncService.set(JSON.parse(reader.result), true).then(() =>
          Promise.all(SyncService.adapters.map(this.refreshAdapter))
        );
        alert(t('Storage.ImportSuccess'));
      }
    };

    const file = this.fileInput.current!.files![0];
    if (file) {
      reader.readAsText(file);
    } else {
      alert(t('Storage.ImportNoFile'));
    }
  };

  private clearIgnoredUsers = () => {
    if (!canClearIgnoredUsers) {
      return;
    }

    clearIgnoredUsers();
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
}
