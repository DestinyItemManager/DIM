import React from 'react';
import { AppIcon, helpIcon } from '../shell/icons';
import ExternalLink from './ExternalLink';
import { t } from 'app/i18next-t';
import styles from './UserGuideLink.m.scss';
import clsx from 'clsx';

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
    <ExternalLink href={link} className={clsx(styles.link, className)}>
      <AppIcon icon={helpIcon} />
      {title || t('General.UserGuideLink')}
    </ExternalLink>
  );
}
