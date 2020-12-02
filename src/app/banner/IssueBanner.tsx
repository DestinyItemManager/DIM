import ExternalLink from 'app/dim-ui/ExternalLink';
import Sheet from 'app/dim-ui/Sheet';
import clsx from 'clsx';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import Ship1 from './1.jpg';
import Ship2 from './2.jpg';
import Game2GiveImage from './game2give.png';
import styles from './IssueBanner.m.scss';

/**
 * A popup we can enable to get the word out about important issues for the DIM community. Edit the body directly.
 */
export default function IssueBanner() {
  const [isMinimized, setIsMinimized] = useState(true);
  const [state, setState] = useState({
    show: false,
    goal: 10000,
    donations: 0,
  });

  const openCampaign = () => {
    setIsMinimized(false);
  };

  const closeCampaign = () => {
    setIsMinimized(true);
  };

  useEffect(() => {
    const getGameTwoGiveData = async () => {
      const response = await fetch(
        `https://www.helpmakemiracles.org/api/1.2/participants/376997?_=${Date.now().toString()}`
      );

      const json = await response.json();

      if (json) {
        setState({
          show: true,
          goal: Number(json?.fundraisingGoal || 10000),
          donations: Number(json?.sumDonations || 0),
        });
      }
    };

    const interval = setInterval(getGameTwoGiveData, 600000);

    getGameTwoGiveData();

    return () => clearInterval(interval);
  }, []);

  // Add a class to body to make padding for this element
  useLayoutEffect(() => {
    if (state.show) {
      document.body.classList.add('issue-banner-shown');
    }
    return () => document.body.classList.remove('issue-banner-shown');
  }, [state.show]);

  return (
    <div
      className={clsx(styles.toaster, {
        [styles.maximized]: !isMinimized,
      })}
    >
      {isMinimized ? (
        state.show && (
          <div
            className="item"
            style={{
              fontSize: `24px`,
              paddingRight: `12px`,
              backgroundColor: `black`,
              position: `unset`,
              contain: `unset`,
              boxSizing: `unset`,
              width: `30rem`,
              transition: `unset`,
              display: 'flex',
            }}
            onClick={openCampaign}
          >
            <div className={styles.gametwogive}>
              <img className={styles.gametwogive} src={Game2GiveImage} />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <div className={styles.thermo}>
                <div className={styles.track}>
                  <div
                    className={styles.mercury}
                    style={{
                      width: `${Math.min((state.donations / state.goal) * 100, 100)}%`,
                    }}
                  >
                    <em>${state.donations}</em>
                  </div>
                </div>
                <div className={styles.goal}>${state.goal}</div>
              </div>
              <div className={styles.buttongroup}>
                <button className="dim-button" type="button">
                  Learn More
                </button>
                <ExternalLink
                  className="dim-button"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  href={
                    'https://www.helpmakemiracles.org/index.cfm?fuseaction=donordrive.participant&participantID=376997'
                  }
                >
                  Donate Now
                </ExternalLink>
                {Date.now() >= Date.parse('2020-12-04T21:50:00.000Z') &&
                  Date.now() <= Date.parse('2020-12-05T02:00:00.000Z') && (
                    <ExternalLink
                      className="dim-button streaming"
                      style={{ backgroundColor: `#c00` }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      href={'https://www.twitch.tv/DestinyItemManager'}
                    >
                      Streaming
                    </ExternalLink>
                  )}
              </div>
            </div>
          </div>
        )
      ) : (
        <Sheet onClose={closeCampaign} header={<h1>#Game2Give #LittleLights</h1>}>
          <div className={styles.container}>
            <p>
              Game2Give is an annual charity event for Destiny fans around the globe in support of
              the{' '}
              <a href="https://bungiefoundation.org/" target="_blank">
                Bungie Foundation
              </a>{' '}
              and{' '}
              <a href="https://childrensmiraclenetworkhospitals.org" target="_blank">
                Children’s Miracle Network Hospitals
              </a>
              ! We're encouraging the community to particpate and support this charity event this
              year by donating to this wonderful cause.
            </p>
            <p>
              <ExternalLink
                className="dim-button"
                href={
                  'https://www.helpmakemiracles.org/index.cfm?fuseaction=donordrive.participant&participantID=376997'
                }
              >
                Donate Now
              </ExternalLink>
            </p>
            <h3>Incentives</h3>
            <ul>
              <li>$10 Donation - Chance to win 130 gift cards from GameStop and EB Games.</li>
              <li>$25 Donation - Limited Edition Gilded Ghost shell and Mist Blossoms emblem</li>
              <li>
                $50 Donation - Every $25 reward, PLUS the Limited Edition Light Keeper’s Emblem
              </li>
              <li>
                $100 Donation - Every $25 and $50 reward, PLUS an exclusive item from the G2G20
                Prize Pool.{' '}
              </li>
            </ul>
            <h3>Milestones</h3>
            <ul>
              <li>
                Each day 2 "Reach Orbit" patches will be raffled from donations $5 or more. Donate
                early for the best chances.
              </li>
              <li>Every $500 - Goose will eat a hotter hotwing on stream.</li>
              <li>
                Top 3 donors will get a 3D (
                <a href={Ship1} target="_blank">
                  1
                </a>
                ) (
                <a href={Ship2} target="_blank">
                  2
                </a>
                ) printed ship from Destiny made by @bhollis on the Team.
              </li>
            </ul>
            <p>
              <ExternalLink
                className="dim-button"
                href={
                  'https://www.helpmakemiracles.org/index.cfm?fuseaction=donordrive.participant&participantID=376997'
                }
              >
                Donate Now
              </ExternalLink>
            </p>
          </div>
        </Sheet>
      )}
    </div>
  );
}
