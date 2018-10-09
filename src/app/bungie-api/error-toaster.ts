import { t } from 'i18next';
import { renderToHtmlByLibraryName } from '../shell/icons';

/**
 * Generates parameters for a toaster based on an error, including DIM and Bungie twitter links.
 *
 * Use this for when you suspect Bungie.net is down.
 */
export function bungieErrorToaster(e: Error) {
  const twitterIcon = `<span style="font-size: 1.8em; vertical-align: middle;">${renderToHtmlByLibraryName(
    'twitterIcon'
  )}</span>`;
  const twitterLink = `<a target="_blank" rel="noopener noreferrer" href="http://twitter.com/ThisIsDIM">Twitter</a> <a target="_blank" rel="noopener noreferrer" href="http://twitter.com/ThisIsDIM">${twitterIcon}</a>`;
  const twitter = `<div> ${t('BungieService.Twitter')} ${twitterLink}</div>`;

  return {
    type: 'error',
    bodyOutputType: 'trustedHtml',
    title: t('BungieService.ErrorTitle'),
    body: e.message + twitter,
    showCloseButton: false
  };
}
