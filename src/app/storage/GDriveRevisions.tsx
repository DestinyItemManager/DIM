import { t } from 'i18next';
import * as React from 'react';
import * as _ from 'underscore';
import './GDriveRevisions.scss';
import { GDriveRevision } from './google-drive-storage';
import { dataStats } from './storage.component';
import { SyncService } from './sync.service';
import { $state } from '../ngimport-more';

interface State {
  revisions?: any;
}

export default class GDriveRevisions extends React.Component<{}, State> {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.getRevisions();
  }

  render() {
    const { revisions } = this.state;

    const header = (
      <p>{t('Storage.RevisionsDescription')}</p>
    );

    if (!revisions) {
      return (
        <div className="dim-page">
          {header}
          <i className="fa fa-spinner fa-spin"/>
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
              <th className="revision-controls"/>
            </tr>
          </thead>
          <tbody>
            {revisions.slice(0).reverse().map((revision) =>
              <GDriveRevisionComponent key={revision.id} revision={revision}/>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  private async getRevisions() {
    const revisions = await SyncService.GoogleDriveStorage.getRevisions();
    this.setState({ revisions });
  }
}

class GDriveRevisionComponent extends React.Component<{
  revision: GDriveRevision;
}, {
  content?: object;
  loading: boolean;
  error?: Error;
}> {
  constructor(props) {
    super(props);
    this.state = {
      loading: false
    };
  }

  render() {
    const { revision } = this.props;
    const { content, loading, error } = this.state;

    return (
      <tr>
        <td className="revision-date">
          <div>{new Date(revision.modifiedTime).toLocaleString()}</div>
          <div>
            {loading && <i className="fa fa-spinner fa-spin"/>}
            {error && error.message}
            <ul>
            {content && _.map(dataStats(content), (value, key) =>
              value > 0 && <li key={key}>{t(`Storage.${key}`, { value })}</li>
            )}
            </ul>
          </div>
        </td>
        <td className="revision-controls">
          {content
            ? <button className="dim-button" onClick={this.restore}>{t('Storage.RestoreRevision')}</button>
            : <button className="dim-button" onClick={this.getRevisionContent}>{t('Storage.LoadRevision')}</button>
          }
        </td>
      </tr>
    );
  }

  private getRevisionContent = async(): Promise<object> => {
    this.setState({ loading: true, error: undefined });
    try {
      const content = await SyncService.GoogleDriveStorage.getRevisionContent(this.props.revision.id);
      this.setState({ content });
      return content;
    } catch (e) {
      this.setState({ error: e });
      throw e;
    } finally {
      this.setState({ loading: false });
    }
  }

  private restore = async() => {
    let content = this.state.content;
    if (!this.state.content) {
      content = await this.getRevisionContent();
    }
    if (content && confirm(t('Storage.ImportConfirm'))) {
      await SyncService.set(content!, true);
      alert(t('Storage.ImportSuccess'));
      $state.go('settings');
    }
  }
}
