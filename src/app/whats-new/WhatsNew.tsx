import { languageSelector } from 'app/dim-api/selectors';
import React from 'react';
import { useSelector } from 'react-redux';
import { Timeline } from 'react-twitter-widgets';
import BungieAlerts from './BungieAlerts';
import ChangeLog from './ChangeLog';
import styles from './WhatsNew.m.scss';

/**
 * What's new in the world of DIM?
 */
export default function WhatsNew() {
  const language = useSelector(languageSelector);
  return (
    <div className="dim-page dim-static-page">
      <BungieAlerts />

      <div className={styles.twitter}>
        <Timeline
          dataSource={{
            sourceType: 'profile',
            screenName: 'ThisIsDIM',
          }}
          options={{
            lang: language,
            dnt: true,
            via: 'ThisIsDIM',
            username: 'ThisIsDIM',
            height: '100%',
            theme: 'dark',
          }}
        />
      </div>

      <ChangeLog />
    </div>
  );
}
