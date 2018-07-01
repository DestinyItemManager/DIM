import * as React from 'react';
import ChangeLog from './ChangeLog';
import BungieAlerts from './BungieAlerts';
import { Timeline } from 'react-twitter-widgets';
import { settings } from '../settings/settings';
import './WhatsNew.scss';

/**
 * What's new in the world of DIM?
 */
export default function WhatsNew() {
  return (
    <div className="dim-page dim-static-page">
      <BungieAlerts />

      <div className="twitter">
        <Timeline
          dataSource={{
            sourceType: 'profile',
            screenName: 'ThisIsDIM'
          }}
          options={{
            lang: settings.language,
            dnt: true,
            via: 'ThisIsDIM',
            username: 'ThisIsDIM',
            height: '100%'
          }}
        />
      </div>

      <ChangeLog />
    </div>
  );
}
