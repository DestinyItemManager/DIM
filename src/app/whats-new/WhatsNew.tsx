import StaticPage from 'app/dim-ui/StaticPage';
import BungieAlerts from './BungieAlerts';
import ChangeLog from './ChangeLog';
import styles from './WhatsNew.m.scss';

/**
 * What's new in the world of DIM?
 */
export default function WhatsNew() {
  return (
    <StaticPage>
      <BungieAlerts />

      <div className={styles.timeline}>
        <iframe
          allowFullScreen
          sandbox="allow-top-navigation allow-scripts allow-popups allow-popups-to-escape-sandbox"
          src="https://www.mastofeed.com/apiv2/feed?userurl=https%3A%2F%2Fmstdn.games%2Fusers%2FThisIsDIM&theme=dark&size=100&header=false&replies=false&boosts=true"
        />
      </div>

      <ChangeLog />
    </StaticPage>
  );
}
