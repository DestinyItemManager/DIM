import changelog from 'docs/CHANGELOG.md';
import React, { useEffect } from 'react';
import './ChangeLog.scss';
import { DimVersions } from './versions';

/**
 * Show the DIM Changelog, with highlights for new changes.
 */
export default function ChangeLog() {
  useEffect(() => {
    DimVersions.changelogWasViewed();
  }, []);

  return (
    <>
      <h1>DIM Changes</h1>
      <Markdown>{changelog}</Markdown>
    </>
  );
}

function Markdown({ children }: { children: string }) {
  return <div dangerouslySetInnerHTML={{ __html: children }} />;
}
