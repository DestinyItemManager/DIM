import StaticPage from 'app/dim-ui/StaticPage';
import { t } from 'app/i18next-t';
import { usePageTitle } from 'app/utils/hooks';
import BungieAlerts from './BungieAlerts';
import ChangeLog from './ChangeLog';

/**
 * What's new in the world of DIM?
 */
export default function WhatsNew() {
  usePageTitle(t('Header.WhatsNew'));
  return (
    <StaticPage>
      <BungieAlerts />
      <ChangeLog />
    </StaticPage>
  );
}
