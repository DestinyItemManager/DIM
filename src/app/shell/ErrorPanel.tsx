import { BungieError, HttpStatusError } from 'app/bungie-api/http-client';
import ExternalLink from 'app/dim-ui/ExternalLink';
import { t } from 'app/i18next-t';
import { DimError } from 'app/utils/dim-error';
import BungieAlerts from 'app/whats-new/BungieAlerts';
import { PlatformErrorCodes } from 'bungie-api-ts/destiny2';
import { AppIcon, helpIcon, mastodonIcon, refreshIcon } from '../shell/icons';
import styles from './ErrorPanel.m.scss';
import { bungieHelpAccount, bungieHelpLink, troubleshootingLink } from './links';

function Socials() {
  return (
    <div className={styles.socials}>
      {['https://mastodon.social/users/bungiehelp'].map((account) => (
        <div key={account} className={styles.timeline}>
          <iframe
            allowFullScreen
            sandbox="allow-top-navigation allow-scripts allow-popups allow-popups-to-escape-sandbox"
            src={`https://www.mastofeed.com/apiv2/feed?userurl=${encodeURIComponent(
              account,
            )}&theme=dark&size=100&header=false&replies=false&boosts=true`}
          />
        </div>
      ))}
    </div>
  );
}

export default function ErrorPanel({
  title,
  error,
  fallbackMessage,
  showSocials,
  showReload,
  frameless,
}: {
  title?: string;
  error?: Error | DimError;
  fallbackMessage?: string;
  showSocials?: boolean;
  showReload?: boolean;
  /** Suitable for showing in a tooltip */
  frameless?: boolean;
}) {
  const underlyingError = error instanceof DimError ? error.cause : undefined;
  showSocials = showSocials ? !(error instanceof DimError) || error.showSocials : false;

  let code: string | number | undefined = error instanceof DimError ? error.code : undefined;
  if (underlyingError) {
    if (underlyingError instanceof BungieError) {
      code = underlyingError.code;
    } else if (underlyingError instanceof HttpStatusError) {
      code = underlyingError.status;
    }
  }

  let name = underlyingError?.name || error?.name;
  let message = error?.message || fallbackMessage;

  const ourFault = !(
    underlyingError instanceof BungieError || underlyingError instanceof HttpStatusError
  );

  if (message?.includes('toSorted') || message?.includes('toReversed')) {
    title = t('ErrorPanel.BrowserTooOldTitle');
    name = 'BrowserTooOld';
    message = `${t('ErrorPanel.BrowserTooOld')}\n${navigator.userAgent}`;
  }

  const content = (
    <>
      <h2>
        {title || t('ErrorBoundary.Title')}

        {error && (
          <span className={styles.errorCode}>
            {name}
            {code !== undefined && ' '}
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
      </p>
      {frameless ? (
        <p>{t('ErrorPanel.ReadTheGuide')}</p>
      ) : (
        <div className={styles.links}>
          {!ourFault && (
            <ExternalLink href={bungieHelpLink} className="dim-button">
              <AppIcon icon={mastodonIcon} /> {bungieHelpAccount}
            </ExternalLink>
          )}
          <ExternalLink href={troubleshootingLink} className="dim-button">
            <AppIcon icon={helpIcon} /> {t('ErrorPanel.Troubleshooting')}
          </ExternalLink>
          {showReload && (
            <div className="dim-button" onClick={() => window.location.reload()}>
              <AppIcon icon={refreshIcon} /> Reload
            </div>
          )}
        </div>
      )}
    </>
  );

  if (frameless) {
    return content;
  }

  return (
    <div>
      <div className={styles.errorPanel}>{content}</div>
      {showSocials && <BungieAlerts />}
      {showSocials && <Socials />}
    </div>
  );
}
