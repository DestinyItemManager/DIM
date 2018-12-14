import * as React from 'react';
import { AppIcon, helpIcon } from '../shell/icons';
import ExternalLink from './ExternalLink';

export default function HelpLink({ helpLink }: { helpLink?: string }) {
  if (!helpLink || helpLink.length === 0) {
    return null;
  }

  return (
    <ExternalLink className="stylizedAnchor" aria-hidden="true" href={helpLink}>
      <AppIcon icon={helpIcon} />
    </ExternalLink>
  );
}
