import { settingsSelector } from 'app/settings/reducer';
import { RootState } from 'app/store/types';
import React from 'react';
import { connect } from 'react-redux';
import { Timeline } from 'react-twitter-widgets';
import BungieAlerts from './BungieAlerts';
import ChangeLog from './ChangeLog';
import './WhatsNew.scss';

interface StoreProps {
  language: string;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    language: settingsSelector(state).language,
  };
}

type Props = StoreProps;

/**
 * What's new in the world of DIM?
 */
function WhatsNew({ language }: Props) {
  return (
    <div className="dim-page dim-static-page">
      <BungieAlerts />

      <div className="twitter">
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
export default connect<StoreProps>(mapStateToProps)(WhatsNew);
