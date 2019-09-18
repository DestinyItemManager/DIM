import React from 'react';
import { t } from 'app/i18next-t';
import ExternalLink from '../dim-ui/ExternalLink';
import { Transition } from '@uirouter/react';
import logo from '../../images/logo-light.svg';
import './page.scss';
import _ from 'lodash';
import { getToken } from 'app/oauth/oauth-token.service';
import { AppIcon } from './icons';
import {
  faTwitter,
  faYoutube,
  faDiscord,
  faGithub,
  faReddit
} from '@fortawesome/free-brands-svg-icons';
import { faTshirt, faHeart } from '@fortawesome/free-solid-svg-icons';

const githubLinkDirect = 'https://github.com/DestinyItemManager/DIM/';
const crowdinLinkDirect =
  'https://crowdin.com/project/destiny-item-manager/invite?d=65a5l46565176393s2a3p403a3u22323e46383232393h4k4r443o4h3d4c333t2a3j4f453f4f3o4u643g393b343n4';
const bungieLinkDirect = 'https://www.bungie.net';
const openCollectiveLinkDirect = 'https://opencollective.com/dim';
const storeLinkDirect = 'https://www.designbyhumans.com/shop/DestinyItemManager/';

const githubLink = `<a href='${githubLinkDirect}' target='_blank' rel='noopener noreferrer'>GitHub</a>`;
const crowdinLink = `<a href='${crowdinLinkDirect}' target='_blank' rel='noopener noreferrer'>Crowdin</a>`;
const bungieLink = `<a href='${bungieLinkDirect}' target='_blank' rel='noopener noreferrer'>Bungie.net</a>`;
const openCollectiveLink = `<a href='${openCollectiveLinkDirect}' target='_blank' rel='noopener noreferrer'>OpenCollective</a>`;
const storeLink = `<a href='${storeLinkDirect}' target='_blank' rel='noopener noreferrer'>DesignByHumans</a>`;
const youTubeLink = 'https://www.youtube.com/channel/UCsNRmUfaeIi5Tk7U0mlZ6UQ';
const twitterLink = 'https://twitter.com/ThisIsDIM';
const redditLink = 'https://destinyitemmanager.reddit.com';
const discordLink = 'https://discord.gg/UK2GWC7';

interface Props {
  transition: Transition;
}
export default class About extends React.Component<Props> {
  componentDidMount() {
    const script = document.createElement('script');

    script.src = 'https://opencollective.com/dim/banner.js';
    script.async = true;

    document.getElementById('opencollective')!.appendChild(script);
  }

  componentWillUnmount() {
    delete window.OC;
  }

  render() {
    const token = getToken();
    return (
      <div className="dim-page dim-static-page">
        <div className="about-header">
          <img src={logo} className="about-logo" alt="DIM Logo" height="48" width="48" />
          <h1>
            <span>{t('Views.About.Header')}</span>
          </h1>
          <a onClick={this.whatsNew}>
            <span>
              {t('Views.About.Version', {
                version: $DIM_VERSION,
                flavor: $DIM_FLAVOR,
                date: new Date($DIM_BUILD_DATE).toLocaleString()
              })}
            </span>
          </a>
        </div>
        <p>{t('Views.About.HowItsMade')}</p>
        {$DIM_FLAVOR === 'release' && <p>{t(`Views.About.Schedule.release`)}</p>}
        {$DIM_FLAVOR === 'beta' && <p>{t(`Views.About.Schedule.beta`)}</p>}
        <p>{t('Views.About.BungieCopyright')}</p>
        {token && (
          <p>
            <ExternalLink
              href={`https://www.bungie.net/en/Profile/ApplicationHistory/254/${token.bungieMembershipId}`}
            >
              {t('Views.About.APIHistory')}
            </ExternalLink>
          </p>
        )}
        <div className="social">
          <div>
            <h2>
              <ExternalLink href={openCollectiveLinkDirect}>
                <AppIcon icon={faHeart} /> {t('Views.Support.Support')}
              </ExternalLink>
            </h2>
            <div
              dangerouslySetInnerHTML={{
                __html: t('Views.Support.OpenCollective', { link: openCollectiveLink })
              }}
            />
          </div>
          <div>
            <h2>
              <ExternalLink href={storeLinkDirect}>
                <AppIcon icon={faTshirt} /> {t('Header.Shop')}
              </ExternalLink>
            </h2>
            <div
              dangerouslySetInnerHTML={{
                __html: t('Views.Support.Store', { link: storeLink })
              }}
            />
          </div>
          <div>
            <h2>
              <ExternalLink href={twitterLink}>
                <AppIcon icon={faTwitter} /> {t('Views.About.Twitter')}
              </ExternalLink>
            </h2>
            {t('Views.About.TwitterHelp')} <br />
            <ExternalLink href={twitterLink}>@ThisIsDIM</ExternalLink>
          </div>
          <div>
            <h2>
              <ExternalLink href={youTubeLink}>
                <AppIcon icon={faYoutube} /> {t('Views.About.YouTube')}
              </ExternalLink>
            </h2>
            {t('Views.About.YouTubeHelp')} <br />
            <ExternalLink href={youTubeLink}>Destiny Item Manager</ExternalLink>
          </div>
          <div>
            <h2>
              <ExternalLink href={redditLink}>
                <AppIcon icon={faReddit} /> {t('Views.About.Reddit')}
              </ExternalLink>
            </h2>
            {t('Views.About.RedditHelp')} <br />
            <ExternalLink href={redditLink}>/r/destinyitemmanager</ExternalLink>
          </div>
          <div>
            <h2>
              <ExternalLink href={discordLink}>
                <AppIcon icon={faDiscord} /> {t('Views.About.Discord')}
              </ExternalLink>
            </h2>
            {t('Views.About.DiscordHelp')}
          </div>
          <div>
            <h2>
              <ExternalLink href={githubLinkDirect}>
                <AppIcon icon={faGithub} /> {t('Views.About.GitHub')}
              </ExternalLink>
            </h2>
            <div
              dangerouslySetInnerHTML={{
                __html: t('Views.About.GitHubHelp', { link: githubLink })
              }}
            />
          </div>
          <div>
            <h2>
              <ExternalLink href={crowdinLinkDirect}>{t('Views.About.Translation')}</ExternalLink>
            </h2>
            <div
              dangerouslySetInnerHTML={{
                __html: t('Views.About.TranslationText', { link: crowdinLink })
              }}
            />
          </div>
        </div>

        <h2>{t('Views.About.FAQ')}</h2>
        <dl>
          <dt>{t('Views.About.FAQMobile')}</dt>
          <dd>{t('Views.About.FAQMobileAnswer')}</dd>
          <dt>{t('Views.About.FAQLogout')}</dt>
          <dd>{t('Views.About.FAQLogoutAnswer')}</dd>
          <dt>{t('Views.About.FAQKeyboard')}</dt>
          <dd>{t('Views.About.FAQKeyboardAnswer')}</dd>
          <dt>{t('Views.About.FAQLostItem')}</dt>
          <dd>
            <div
              dangerouslySetInnerHTML={{
                __html: t('Views.About.FAQLostItemAnswer', { link: bungieLink })
              }}
            />
            {token && (
              <p>
                <ExternalLink
                  href={`https://www.bungie.net/en/Profile/ApplicationHistory/254/${token.bungieMembershipId}`}
                >
                  {t('Views.About.APIHistory')}
                </ExternalLink>
              </p>
            )}
          </dd>
          <dt>{t('Views.About.FAQAccess')}</dt>
          <dd>{t('Views.About.FAQAccessAnswer')}</dd>
        </dl>

        <h1>{t('Views.Support.Support')}</h1>
        <p>{t('Views.Support.FreeToDownload')}</p>
        <p>
          <span
            dangerouslySetInnerHTML={{
              __html: t('Views.Support.OpenCollective', { link: openCollectiveLink })
            }}
          />{' '}
          {t('Views.Support.BackersDetail')}
        </p>
        <div id="opencollective" />
      </div>
    );
  }

  private whatsNew = () => this.props.transition.router.stateService.go('whats-new');
}
