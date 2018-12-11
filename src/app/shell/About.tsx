import * as React from 'react';
import { t } from 'i18next';
import ExternalLink from '../dim-ui/ExternalLink';
import { Transition } from '@uirouter/react';
// tslint:disable-next-line:no-implicit-dependencies
import logo from '../../images/logo-light.svg';
import './page.scss';

const githubLink =
  "<a href='https://github.com/DestinyItemManager/DIM/' target='_blank' rel='noopener noreferrer'>GitHub</a>";
const crowdinLink =
  "<a href='https://crowdin.com/project/destiny-item-manager/invite?d=65a5l46565176393s2a3p403a3u22323e46383232393h4k4r443o4h3d4c333t2a3j4f453f4f3o4u643g393b343n4' target='_blank' rel='noopener noreferrer'>Crowdin</a>";
const bungieLink =
  "<a href='https://www.bungie.net' target='_blank' rel='noopener noreferrer'>Bungie.net</a>";

export default function About({ transition }: { transition: Transition }) {
  const whatsNew = () => transition.router.stateService.go('whats-new');

  return (
    <div className="dim-page dim-static-page">
      <h1>
        <img src={logo} alt="DIM Logo" height="36" width="36" />
        <span>{t('Views.About.Header')}</span>
      </h1>
      <a onClick={whatsNew}>
        <span>
          {t('Views.About.Version', {
            version: $DIM_VERSION,
            flavor: $DIM_FLAVOR,
            date: new Date($DIM_BUILD_DATE).toLocaleString()
          })}
        </span>
      </a>
      <p>{t('Views.About.HowItsMade')}</p>
      {$DIM_FLAVOR !== 'dev' && <p>{t('Views.About.Schedule', { context: $DIM_FLAVOR })}</p>}
      <h2>{t('Views.About.ContactUs')}</h2>
      <dl>
        <dt>{t('Views.About.Twitter')}</dt>
        <dd>
          <span>{t('Views.About.TwitterHelp')}</span> <br />
          <ExternalLink href="https://twitter.com/ThisIsDIM">@ThisIsDIM</ExternalLink>
        </dd>
        <dt>{t('Views.About.Reddit')}</dt>
        <dd>
          <span>{t('Views.About.RedditHelp')}</span> <br />
          <ExternalLink href="https://destinyitemmanager.reddit.com">
            /r/destinyitemmanager
          </ExternalLink>
        </dd>
        <dt>{t('Views.About.Discord')}</dt>
        <dd>
          <span>{t('Views.About.DiscordHelp')}</span> <br />
          <ExternalLink href="https://discord.gg/UK2GWC7">{t('Views.About.Discord')}</ExternalLink>
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
        <dt>{t('Views.About.FAQDupeGally')}</dt>
        <dd>{t('Views.About.FAQDupeGallyAnswer')}</dd>
      </dl>
      <p>{t('Views.About.BungieCopyright')}</p>
    </div>
  );
}
