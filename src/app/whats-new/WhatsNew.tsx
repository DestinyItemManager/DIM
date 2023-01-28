import StaticPage from 'app/dim-ui/StaticPage';
import React from 'react';
import BungieAlerts from './BungieAlerts';
import ChangeLog from './ChangeLog';
import styles from './WhatsNew.m.scss';

const Timeline = React.lazy(async () => {
  const m = await import(/* webpackChunkName: "twitter" */ 'react-twitter-widgets');
  return { default: m.Timeline };
});

/**
 * What's new in the world of DIM?
 */
export default function WhatsNew() {
  return (
    <StaticPage>
      <BungieAlerts />

      <div className={styles.timeline}>
        <React.Suspense fallback={null}>
          <Timeline
            dataSource={{
              sourceType: 'profile',
              screenName: 'ThisIsDIM',
            }}
            options={{
              dnt: true,
              theme: 'dark',
              chrome: 'noheader nofooter noborders',
            }}
          />
        </React.Suspense>
      </div>

      <ChangeLog />
    </StaticPage>
  );
}
