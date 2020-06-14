import React, { useState } from 'react';
import Sheet from 'app/dim-ui/Sheet';
import styles from './IssueBanner.m.scss';
import ExternalLink from 'app/dim-ui/ExternalLink';
import clsx from 'clsx';

const blmResourcesLink = 'https://blacklivesmatters.carrd.co/';

/**
 * A popup we can enable to get the word out about important issues for the DIM community. Edit the body directly.
 */
const IssueBanner = () => {
  const [isMinimized, setIsMinimized] = useState(true);

  const openCampaign = () => {
    setIsMinimized(false);
  };

  const closeCampaign = () => {
    setIsMinimized(true);
  };

  return (
    <div
      className={clsx(styles.toaster, {
        [styles.maximized]: !isMinimized,
      })}
    >
      {isMinimized ? (
        <div
          className="item"
          style={{
            fontSize: `24px`,
            padding: `12px 24px`,
            backgroundColor: `black`,
            position: `unset`,
            contain: `unset`,
            boxSizing: `unset`,
            width: `unset`,
            transition: `unset`,
          }}
          onClick={openCampaign}
        >
          Black Lives Matter
        </div>
      ) : (
        <Sheet onClose={closeCampaign} header={<h1>Black Lives Matter</h1>}>
          <div className={styles.container}>
            <p>
              DIM stands in solidarity with the Black community in acknowledging centuries of white
              oppression and violence. Rest in power George Floyd, Breonna Taylor, Ahmaud Arbery,
              and the countless victims of systemic violence.
            </p>
            <p>Learn how you can help those fighting for justice:</p>
            <p>
              <ExternalLink className="dim-button" href={blmResourcesLink}>
                Donate, sign petitions, protest
              </ExternalLink>
            </p>
          </div>
        </Sheet>
      )}
    </div>
  );
};

export { IssueBanner };
