import ExternalLink from 'app/dim-ui/ExternalLink';
import { percent } from 'app/shell/formatters';

import * as styles from './Game2Give.m.scss';
// import heroimage from './bungie-day-giving-festival.jpg';
import heroimage from './g2g-banner.jpg';
import useGame2GiveData from './useGame2GiveData';

export default function Game2Give() {
  const game2GiveState = useGame2GiveData();

  return (
    <div className={styles.issueAwarenessBanner}>
      {game2GiveState.loaded && (
        <div className={styles.item}>
          <div className={styles.info}>
            <p className={styles.cta}>
              Support the Bungie Foundation so together we can make an impact on the world. Donate
              $100 to enter a raffle for a custom painted Nerf Gjallarhorn!
            </p>
            <div className={styles.buttons}>
              <ExternalLink
                href="https://bungiefoundation.donordrive.com/index.cfm?fuseaction=donate.participant&participantID=22881"
                className="dim-button"
              >
                Donate
              </ExternalLink>
              <ExternalLink
                href="https://bungiefoundation.donordrive.com/index.cfm?fuseaction=donorDrive.participant&participantID=22881"
                className="dim-button"
              >
                Learn More
              </ExternalLink>
              {game2GiveState.streamIsLive && game2GiveState.streamIsEnabled && (
                <ExternalLink
                  href="https://www.twitch.tv/DestinyItemManager"
                  className="dim-button"
                >
                  🔴 Live Stream
                </ExternalLink>
              )}
            </div>
            <div className={styles.thermo}>
              <div className={styles.track}>
                <div
                  className={styles.mercury}
                  style={{
                    width: percent(game2GiveState.donations / game2GiveState.goal),
                  }}
                >
                  <em>${game2GiveState.donations.toLocaleString()}</em>
                </div>
              </div>
              <div className={styles.goal}>${game2GiveState.goal.toLocaleString()}</div>
            </div>
          </div>
          <img src={heroimage} className={styles.hero} />
          {/* {game2GiveState.error && <div>Error loading latest</div>} */}
        </div>
      )}
      {/* {!game2GiveState.loaded && game2GiveState.error && (
        <div>
          <pre>{JSON.stringify(game2GiveState, null, 2)}</pre>
          Can't load data atm
        </div>
      )} */}
    </div>
  );
}
