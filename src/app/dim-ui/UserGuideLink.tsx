import { t } from 'app/i18next-t';
import { AppIcon, helpIcon } from 'app/shell/icons';
import clsx from 'clsx';
import React from 'react';
import ExternalLink from './ExternalLink';

/**
 * Link to a specific topic in the DIM User Guide wiki.
 */
export default function UserGuideLink({
  topic,
  title,
  className,
}: {
  topic?: string;
  title?: string;
  className?: string;
}) {
  if (!topic || topic.length === 0) {
    return null;
  }

  const link = `https://destinyitemmanager.fandom.com/wiki/${topic}`;

  return (
    <ExternalLink href={link} className={clsx('dim-button', className)}>
      <AppIcon icon={helpIcon} /> {title || t('General.UserGuideLink')}
    </ExternalLink>
  );
}
