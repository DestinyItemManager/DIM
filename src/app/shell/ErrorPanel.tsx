import { BungieError, HttpStatusError } from 'app/bungie-api/http-client';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import { AppIcon, helpIcon, refreshIcon, twitterIcon } from 'app/shell/icons';
import { DimError } from 'app/utils/dim-error';
import React from 'react';
import styles from './ErrorPanel.m.scss';

const bungieHelpLink = 'http://twitter.com/BungieHelp';
const dimHelpLink = 'http://twitter.com/ThisIsDIM';
const troubleshootingLink = 'https://destinyitemmanager.fandom.com/wiki/Troubleshooting';
const Timeline = React.lazy(async () => {
  const m = await import(/* webpackChunkName: "twitter" */ 'react-twitter-widgets');
  return { default: m.Timeline };
});

const twitters = (
  <div className={styles.twitters}>
    <React.Suspense fallback={null}>
      <Timeline
        dataSource={{
          sourceType: 'profile',
          screenName: 'BungieHelp',
        }}
        options={{
          dnt: true,
          via: 'BungieHelp',
          username: 'BungieHelp',
          height: '100%',
          theme: 'dark',
        }}
      />
      <Timeline
        dataSource={{
          sourceType: 'profile',
          screenName: 'ThisIsDIM',
        }}
        options={{
          dnt: true,
          via: 'ThisIsDIM',
          username: 'ThisIsDIM',
          height: '100%',
          theme: 'dark',
        }}
      />
    </React.Suspense>
  </div>
);

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
          {message} {underlyingError instanceof BungieError && t('ErrorPanel.Description')}
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
      {showTwitters && twitters}
    </div>
  );
}
