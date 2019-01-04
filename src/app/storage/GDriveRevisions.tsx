import { t } from 'i18next';
import * as React from 'react';
import * as _ from 'lodash';
import './GDriveRevisions.scss';
import { GDriveRevision } from './google-drive-storage';
import { dataStats } from './data-stats';
import { SyncService } from './sync.service';
import { UIViewInjectedProps } from '@uirouter/react';
import { refreshIcon, AppIcon } from '../shell/icons';
import { initSettings } from '../settings/settings';
import { dimLoadoutService } from '../loadout/loadout.service';

interface State {
  revisions?: any;
}

export default class GDriveRevisions extends React.Component<UIViewInjectedProps, State> {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.getRevisions();
  }

  render() {
    const { revisions } = this.state;

    const header = <p>{t('Storage.RevisionsDescription')}</p>;

    if (!revisions) {
      return (
        <div className="dim-page">
          {header}
          <AppIcon icon={refreshIcon} spinning={true} />
        </div>
      );
    }

    return (
      <div className="dim-page">
        {header}
        <table className="gdrive-revisions">
          <thead>
            <tr>
              <th className="revision-date">Date</th>
              <th className="revision-controls" />
            </tr>
          </thead>
          <tbody>
            {revisions
              .slice(0)
              .reverse()
              .map((revision) => (
                <GDriveRevisionComponent
                  key={revision.id}
                  revision={revision}
                  onRestoreSuccess={this.onRestoreSuccess}
                />
              ))}
          </tbody>
        </table>
      </div>
    );
  }

  private async getRevisions() {
    const revisions = await SyncService.GoogleDriveStorage.getRevisions();
    this.setState({ revisions });
  }

  private onRestoreSuccess = () => {
    this.props.transition!.router.stateService.go('settings');
  };
}

class GDriveRevisionComponent extends React.Component<
  {
    revision: GDriveRevision;
    onRestoreSuccess(): void;
  },
  {
    content?: object;
    loading: boolean;
    error?: Error;
  }
> {
  constructor(props) {
    super(props);
    this.state = {
      loading: false
    };
    // There's a Safari bug that makes "private restore = async() => {}" throw "Can't find private variable: @derivedConstructor". It's fixed in the latest iOS but not all of them.
    this.restore = this.restore.bind(this);
    this.getRevisionContent = this.getRevisionContent.bind(this);
  }

  render() {
    const { revision } = this.props;
    const { content, loading, error } = this.state;

    return (
      <tr>
        <td className="revision-date">
          <div>{new Date(revision.modifiedTime).toLocaleString()}</div>
          <div>
            {loading && <AppIcon icon={refreshIcon} spinning={true} />}
            {error && error.message}
            <ul>
              {content &&
                _.map(
                  dataStats(content),
                  (value, key) => value > 0 && <li key={key}>{t(`Storage.${key}`, { value })}</li>
                )}
            </ul>
          </div>
        </td>
        <td className="revision-controls">
          {content ? (
            <button className="dim-button" onClick={this.restore}>
              {t('Storage.RestoreRevision')}
            </button>
          ) : (
            <button className="dim-button" onClick={this.getRevisionContent}>
              {t('Storage.LoadRevision')}
            </button>
          )}
        </td>
      </tr>
    );
  }

  private async getRevisionContent(): Promise<object> {
    this.setState({ loading: true, error: undefined });
    try {
      const content = await SyncService.GoogleDriveStorage.getRevisionContent(
        this.props.revision.id
      );
      this.setState({ content });
      return content;
    } catch (e) {
      this.setState({ error: e });
      throw e;
    } finally {
      this.setState({ loading: false });
    }
  }

  private async restore() {
    let content = this.state.content;
    if (!this.state.content) {
      content = await this.getRevisionContent();
    }

    if (content) {
      const stats = dataStats(content);
      const statsLine = _.map(stats, (value, key) =>
        value ? t(`Storage.${key}`, { value }) : undefined
      )
        .filter(Boolean)
        .join(', ');
      if (confirm(t('Storage.ImportConfirm', { stats: statsLine }))) {
        await SyncService.set(content, true);
        alert(t('Storage.ImportSuccess'));
        initSettings();
        dimLoadoutService.getLoadouts(true);
        this.props.onRestoreSuccess();
      }
    }
  }
}
