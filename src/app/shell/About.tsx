import * as React from 'react';
import { t } from 'i18next';
import ExternalLink from '../dim-ui/ExternalLink';
import { Transition } from '@uirouter/react';
import logo from '../../images/logo-light.svg';
import './page.scss';
import * as _ from 'lodash';

const githubLink =
  "<a href='https://github.com/DestinyItemManager/DIM/' target='_blank' rel='noopener noreferrer'>GitHub</a>";
const crowdinLink =
  "<a href='https://crowdin.com/project/destiny-item-manager/invite?d=65a5l46565176393s2a3p403a3u22323e46383232393h4k4r443o4h3d4c333t2a3j4f453f4f3o4u643g393b343n4' target='_blank' rel='noopener noreferrer'>Crowdin</a>";
const bungieLink =
  "<a href='https://www.bungie.net' target='_blank' rel='noopener noreferrer'>Bungie.net</a>";

interface Props {
  transition: Transition;
}

export default class About extends React.Component<Props> {
  render() {
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
        {$DIM_FLAVOR !== 'dev' && <p>{t('Views.About.Schedule', { context: $DIM_FLAVOR })}</p>}
        <p>{t('Views.About.BungieCopyright')}</p>
        <dl>
          <dt>{t('Views.About.Twitter')}</dt>
          <dd>
            {t('Views.About.TwitterHelp')} <br />
            <ExternalLink href="https://twitter.com/ThisIsDIM">@ThisIsDIM</ExternalLink>
          </dd>
          <dt>{t('Views.About.YouTube')}</dt>
          <dd>
            {t('Views.About.YouTubeHelp')} <br />
            <ExternalLink href="https://www.youtube.com/channel/UCsNRmUfaeIi5Tk7U0mlZ6UQ">
              Destiny Item Manager
            </ExternalLink>
          </dd>
          <dt>{t('Views.About.Reddit')}</dt>
          <dd>
            {t('Views.About.RedditHelp')} <br />
            <ExternalLink href="https://destinyitemmanager.reddit.com">
              /r/destinyitemmanager
            </ExternalLink>
          </dd>
          <dt>{t('Views.About.Discord')}</dt>
          <dd>
            {t('Views.About.DiscordHelp')} <br />
            <ExternalLink href="https://discord.gg/UK2GWC7">
              {t('Views.About.Discord')}
            </ExternalLink>
          </dd>
          <dt>{t('Views.About.GitHub')}</dt>
          <dd
            dangerouslySetInnerHTML={{ __html: t('Views.About.GitHubHelp', { link: githubLink }) }}
          />
          <dt>{t('Views.About.Translation')}</dt>
          <dd
            dangerouslySetInnerHTML={{
              __html: t('Views.About.TranslationText', { link: crowdinLink })
            }}
          />
        </dl>

        <h2>{t('Views.About.FAQ')}</h2>
        <dl>
          <dt>{t('Views.About.FAQMobile')}</dt>
          <dd>{t('Views.About.FAQMobileAnswer')}</dd>
          <dt>{t('Views.About.FAQLogout')}</dt>
          <dd>{t('Views.About.FAQLogoutAnswer')}</dd>
          <dt>{t('Views.About.FAQKeyboard')}</dt>
          <dd>{t('Views.About.FAQKeyboardAnswer')}</dd>
          <dt>{t('Views.About.FAQLostItem')}</dt>
          <dd
            dangerouslySetInnerHTML={{
              __html: t('Views.About.FAQLostItemAnswer', { link: bungieLink })
            }}
          />
          <dt>{t('Views.About.FAQAccess')}</dt>
          <dd>{t('Views.About.FAQAccessAnswer')}</dd>
        </dl>
      </div>
    );
  }

  private whatsNew = () => this.props.transition.router.stateService.go('whats-new');
}
