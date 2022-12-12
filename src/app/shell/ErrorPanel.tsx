import { BungieError, HttpStatusError } from 'app/bungie-api/http-client';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import { DimError } from 'app/utils/dim-error';
import { PlatformErrorCodes } from 'bungie-api-ts/destiny2';
import React, { useState } from 'react';
import { AppIcon, helpIcon, refreshIcon, twitterIcon } from '../shell/icons';
import styles from './ErrorPanel.m.scss';

const bungieHelpLink = 'http://twitter.com/BungieHelp';
const dimHelpLink = 'http://twitter.com/ThisIsDIM';
const troubleshootingLink = 'https://github.com/DestinyItemManager/DIM/wiki/Troubleshooting';
const Timeline = React.lazy(async () => {
  const m = await import(/* webpackChunkName: "twitter" */ 'react-twitter-widgets');
  return { default: m.Timeline };
});
const error1618LinkDirect = 'https://github.com/DestinyItemManager/DIM/wiki/BungieError-1618';

function Twitters() {
  const [error, setError] = useState(false);
  // If the user has blocked twitter just don't show them
  if (error) {
    return null;
  }
  return (
    <div className={styles.twitters}>
      <React.Suspense fallback={null}>
        {['BungieHelp', 'ThisIsDIM'].map((account) => (
          <div key={account} className={styles.timeline}>
            <Timeline
              dataSource={{
                sourceType: 'profile',
                screenName: account,
              }}
              options={{
                dnt: true,
                theme: 'dark',
                chrome: 'noheader nofooter noborders',
              }}
              renderError={() => {
                setError(true);
                return null;
              }}
            />
          </div>
        ))}
      </React.Suspense>
    </div>
  );
}

export default function ErrorPanel({
  title,
  error,
  fallbackMessage,
  showTwitters,
  children,
  showReload,
}: {
  title?: string;
  error?: Error | DimError;
  fallbackMessage?: string;
  showTwitters?: boolean;
  showReload?: boolean;
  children?: React.ReactNode;
}) {
  const underlyingError = error instanceof DimError ? error.cause : undefined;

  let code: string | number | undefined = error instanceof DimError ? error.code : undefined;
  if (underlyingError) {
    if (underlyingError instanceof BungieError) {
      code = underlyingError.code;
    } else if (underlyingError instanceof HttpStatusError) {
      code = underlyingError.status;
    }
  }

  const name = underlyingError?.name || error?.name;
  const message = error?.message || fallbackMessage;

  const ourFault = !(
    underlyingError instanceof BungieError || underlyingError instanceof HttpStatusError
  );

  return (
    <div>
      <div className={styles.errorPanel}>
        <h2>
          {title || t('ErrorBoundary.Title')}

          {error && (
            <span className={styles.errorCode}>
              {name}
              {code && ' '}
              {code}
            </span>
          )}
        </h2>
        <p>
          {message}
          {underlyingError instanceof BungieError && (
            <span>
              {' '}
              {underlyingError.code === PlatformErrorCodes.SystemDisabled
                ? t('ErrorPanel.SystemDown')
                : t('ErrorPanel.Description')}
            </span>
          )}
          {underlyingError instanceof BungieError &&
            underlyingError.code === PlatformErrorCodes.DestinyUnexpectedError && (
              <span>
                {' '}
                {t('ErrorPanel.EmblemError')}{' '}
                <ExternalLink href={error1618LinkDirect}>
                  {t('ErrorPanel.EmblemErrorLink')}
                </ExternalLink>
              </span>
            )}
        </p>
        {children}
        <div className={styles.twitterLinks}>
          {!ourFault && (
            <ExternalLink href={bungieHelpLink} className="dim-button">
              <AppIcon icon={twitterIcon} /> @BungieHelp
            </ExternalLink>
          )}
          <ExternalLink href={dimHelpLink} className="dim-button">
            <AppIcon icon={twitterIcon} /> @ThisIsDim
          </ExternalLink>
          <ExternalLink href={troubleshootingLink} className="dim-button">
            <AppIcon icon={helpIcon} /> {t('ErrorPanel.Troubleshooting')}
          </ExternalLink>
          {showReload && (
            <div className="dim-button" onClick={() => window.location.reload()}>
              <AppIcon icon={refreshIcon} /> Reload
            </div>
          )}
        </div>
      </div>
      {showTwitters && <Twitters />}
    </div>
  );
}
