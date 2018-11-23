import * as React from 'react';
import { AppIcon, helpIcon } from '../shell/icons';

export default function HelpLink({ helpLink }: { helpLink?: string }) {
  if (!helpLink || helpLink.length === 0) {
    return null;
  }

  return (
    <a
      className="stylizedAnchor"
      aria-hidden="true"
      href={helpLink}
      target="_blank"
      rel="noopener noreferrer"
    >
      <AppIcon icon={helpIcon} />
    </a>
  );
}
