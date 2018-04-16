import * as React from 'react';
import changelog from '../../../docs/CHANGELOG.md';
import './ChangeLog.scss';

export default class ChangeLog extends React.Component {
  render() {
    return (
      <div className="changelog">
        <h1>DIM Changes</h1>
        {changelog.map((version) =>
          <div key={version.version}>
            <h2>{version.version}{version.date && <span className="changelog-date">({new Date(version.date).toLocaleDateString()})</span>}</h2>
            <ul>
              {version.changes.map((change, index) =>
                <li key={index}>{change}</li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }
}
