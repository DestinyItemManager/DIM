import React from 'react';
import Markdown from 'markdown-to-jsx';
import changelog from '../../../docs/CHANGELOG.md';
import './ChangeLog.scss';
import { DimVersions } from './versions';

/**
 * Show the DIM Changelog, with highlights for new changes.
 */
export default function ChangeLog() {
  const rendered = (
    <div className="changelog">
      <h1>DIM Changes</h1>
      <Markdown>{changelog}</Markdown>
    </div>
  );
  DimVersions.changelogWasViewed();
  return rendered;
}
