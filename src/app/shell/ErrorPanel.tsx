import React from 'react';
import { DimError } from 'app/bungie-api/bungie-service-helper';
import { AppIcon, twitterIcon, refreshIcon } from '../shell/icons';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import styles from './ErrorPanel.m.scss';

const bungieHelpLink = 'http://twitter.com/BungieHelp';
const dimHelpLink = 'http://twitter.com/ThisIsDIM';
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
          screenName: 'BungieHelp'
        }}
        options={{
          dnt: true,
          via: 'BungieHelp',
          username: 'BungieHelp',
          height: '100%'
        }}
      />
      <Timeline
        dataSource={{
          sourceType: 'profile',
          screenName: 'ThisIsDIM'
        }}
        options={{
          dnt: true,
          via: 'ThisIsDIM',
          username: 'ThisIsDIM',
          height: '100%'
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
  showReload
}: {
  title?: string;
  error?: DimError;
  fallbackMessage?: string;
  showTwitters?: boolean;
  showReload?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className={styles.errorPanel}>
        <h2>
          {title || t('ErrorBoundary.Title')}

          {error && error.code && error.code > 0 && (
            <span className={styles.errorCode}>Error {error.code}</span>
          )}
        </h2>
        <p>
          {error ? error.message : fallbackMessage}{' '}
          {error && error.code && error.code > 0 && t('ErrorPanel.Description')}
        </p>
        {children}
        <div className={styles.twitterLinks}>
          <ExternalLink href={bungieHelpLink} className="dim-button">
            <AppIcon icon={twitterIcon} /> @BungieHelp
          </ExternalLink>
          <ExternalLink href={dimHelpLink} className="dim-button">
            <AppIcon icon={twitterIcon} /> @ThisIsDim
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
