import React from 'react';
import Markdown from 'markdown-to-jsx';
import changelog from '../../../docs/CHANGELOG.md';
import './ChangeLog.scss';
import { DimVersions } from './versions';

/**
 * Show the DIM Changelog, with highlights for new changes.
 */
export default function ChangeLog() {
  DimVersions.changelogWasViewed();
  return <Markdown children={changelog}></Markdown>;
}
