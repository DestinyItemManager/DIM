import { t } from 'i18next';

/**
 * Generates parameters for a toaster based on an error, including DIM and Bungie twitter links.
 *
 * Use this for when you suspect Bungie.net is down.
 */
export function bungieErrorToaster(e) {
  const twitterLink = '<a target="_blank" rel="noopener noreferrer" href="http://twitter.com/ThisIsDIM">Twitter</a> <a target="_blank" rel="noopener noreferrer" href="http://twitter.com/ThisIsDIM"><i class="fa fa-twitter fa-2x" style="vertical-align: middle;"></i></a>';
  const twitter = `<div> ${t('BungieService.Twitter')} ${twitterLink}</div>`;

  return {
    type: 'error',
    bodyOutputType: 'trustedHtml',
    title: 'Bungie.net Error',
    body: e.message + twitter,
    showCloseButton: false
  };
}
