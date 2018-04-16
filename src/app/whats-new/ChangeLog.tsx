import * as React from 'react';
import changelog from '../../../docs/CHANGELOG.md';
import './ChangeLog.scss';
import { DimVersions } from '../shell/versions';

export default function ChangeLog() {
  const rendered = (
    <div className="changelog">
      <h1>DIM Changes</h1>
      {changelog.map((version) =>
        <div key={version.version}>
          <h2>
            {DimVersions.versionIsNew(version.version) && <span className="badge-new"/>}
            {version.version}
            {version.date && <span className="changelog-date">({new Date(version.date).toLocaleDateString()})</span>}
          </h2>
          <ul>
            {version.changes.map((change, index) =>
              <li key={index}>{change}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );

  DimVersions.changelogWasViewed();

  return rendered;
}
