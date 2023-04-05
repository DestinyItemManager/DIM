import { t } from 'app/i18next-t';
import { AppIcon, helpIcon } from '../shell/icons';
import ExternalLink from './ExternalLink';
import styles from './HelpLink.m.scss';

export default function HelpLink({ helpLink }: { helpLink?: string }) {
  if (!helpLink || helpLink.length === 0) {
    return null;
  }

  return (
    <ExternalLink className={styles.helpLink} title={t('General.UserGuideLink')} href={helpLink}>
      <AppIcon icon={helpIcon} />
    </ExternalLink>
  );
}
