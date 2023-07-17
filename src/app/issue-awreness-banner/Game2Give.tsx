import clsx from 'clsx';
import { useEffect } from 'react';
import styles from './Game2Give.m.scss';
import heroimage from './bungie-day-giving-festival.jpg';
import useGame2GiveData from './useGame2GiveData';

const itemStyles = {
  fontSize: '24px',
  backgroundColor: '#111',
  position: 'unset',
  contain: 'unset',
  boxSizing: 'unset',
  width: 'auto',
  height: 'unset',
  transition: 'unset',
  display: 'flex',
} as const;

export default function Game2Give() {
  const game2GiveState = useGame2GiveData();

  useEffect(() => {
    const className = 'issue-awareness-active';

    if (game2GiveState.loaded) {
      document.body.classList.add(className);
    }

    return () => {
      document.body.classList.remove(className);
    };
  }, [game2GiveState.loaded]);

  return (
    <div className={clsx(styles.issueAwarenessBanner)}>
      {game2GiveState.loaded && (
        <div className="item" style={itemStyles}>
          <img
            src={heroimage}
            style={{
              width: '50%',
              objectFit: 'contain',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              justifyContent: 'flex-start',
              padding: '.25rem',
              flexGrow: 1,
            }}
          >
            <p style={{ fontSize: '1rem', margin: 0, textAlign: 'center', flexGrow: 1 }}>
              Support the Bungie Foundation so together we can make an impact on the world.
            </p>
            <div
              style={{
                display: 'flex',
                padding: '.25rem 0',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  window.open(
                    'https://bungiefoundation.donordrive.com/index.cfm?fuseaction=donate.participant&participantID=19805',
                    '_blank',
                    'noopener,noreferrer'
                  );
                }}
              >
                Donate
              </button>
              <button
                type="button"
                onClick={() => {
                  window.open(
                    'https://bungiefoundation.donordrive.com/index.cfm?fuseaction=donorDrive.participant&participantID=19805',
                    '_blank',
                    'noopener,noreferrer'
                  );
                }}
              >
                Learn More
              </button>
              {game2GiveState.streamIsLive && game2GiveState.streamIsEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    window.open(
                      'https://www.twitch.tv/DestinyItemManager',
                      '_blank',
                      'noopener,noreferrer'
                    );
                  }}
                >
                  🔴Live Stream
                </button>
              )}
            </div>
            <div className={styles.thermo}>
              <div className={styles.track}>
                <div
                  className={styles.mercury}
                  style={{
                    width: `${Math.min(
                      (game2GiveState.donations / game2GiveState.goal) * 100,
                      100
                    )}%`,
                  }}
                >
                  <em>${game2GiveState.donations.toLocaleString()}</em>
                </div>
              </div>
              <div className={styles.goal}>${game2GiveState.goal.toLocaleString()}</div>
            </div>
          </div>
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
