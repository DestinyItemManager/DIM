import { t } from 'app/i18next-t';
import ExternalLink from '../dim-ui/ExternalLink';
import { NotifyInput } from '../notifications/notifications';
import { AppIcon, twitterIcon } from '../shell/icons';

/**
 * Generates parameters for a toaster based on an error, including DIM and Bungie twitter links.
 *
 * Use this for when you suspect Bungie.net is down.
 */
export function bungieErrorToaster(e: Error): NotifyInput {
  return {
    type: 'error',
    title: t('BungieService.ErrorTitle'),
    body: (
      <>
        {e ? e.message : t('BungieService.Difficulties')}{' '}
        <div>
          {t('BungieService.Twitter')}{' '}
          <ExternalLink href="http://twitter.com/BungieHelp">Twitter</ExternalLink>{' '}
          <ExternalLink href="http://twitter.com/BungieHelp">
            <span style={{ fontSize: '1.5em', verticalAlign: 'middle' }}>
              <AppIcon icon={twitterIcon} />
            </span>
          </ExternalLink>
        </div>
      </>
    ),
  };
}

export function dimErrorToaster(title: string, message: string, e: Error): NotifyInput {
  return {
    type: 'error',
    title,
    body: (
      <>
        <div>{message}</div>
        <div>{e.message}</div>
        <div>
          {t('BungieService.Twitter')}{' '}
          <ExternalLink href="http://twitter.com/ThisIsDIM">Twitter</ExternalLink>{' '}
          <ExternalLink href="http://twitter.com/ThisIsDIM">
            <span style={{ fontSize: '1.5em', verticalAlign: 'middle' }}>
              <AppIcon icon={twitterIcon} />
            </span>
          </ExternalLink>
        </div>
      </>
    ),
    duration: 60_000,
  };
}
