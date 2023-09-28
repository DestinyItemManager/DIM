import { t } from 'app/i18next-t';
import { bungieHelpAccount, bungieHelpLink } from 'app/shell/links';
import ExternalLink from '../dim-ui/ExternalLink';
import { NotifyInput } from '../notifications/notifications';
import { AppIcon, mastodonIcon } from '../shell/icons';

/**
 * Generates parameters for a toaster based on an error, including DIM and Bungie social links.
 *
 * Use this for when you suspect Bungie.net is down.
 */
export function bungieErrorToaster(errorMessage: string | undefined): NotifyInput {
  return {
    type: 'error',
    title: t('BungieService.ErrorTitle'),
    body: (
      <>
        {errorMessage ?? t('BungieService.Difficulties')}{' '}
        <div>
          {t('BungieService.Twitter')}{' '}
          <ExternalLink href={bungieHelpLink}>{bungieHelpAccount}</ExternalLink>{' '}
          <ExternalLink href={bungieHelpLink}>
            <span style={{ fontSize: '1.5em', verticalAlign: 'middle' }}>
              <AppIcon icon={mastodonIcon} />
            </span>
          </ExternalLink>
        </div>
      </>
    ),
  };
}

export function dimErrorToaster(title: string, message: string, errorMessage: string): NotifyInput {
  return {
    type: 'error',
    title,
    body: (
      <>
        <div>{message}</div>
        <div>{errorMessage}</div>
      </>
    ),
    duration: 60_000,
  };
}
