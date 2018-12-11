import * as React from 'react';
import { t } from 'i18next';
import * as _ from 'lodash';
import ExternalLink from '../dim-ui/ExternalLink';
import './page.scss';

const openCollectiveLink =
  "<a href='https://opencollective.com/dim' target='_blank' rel='noopener noreferrer'>OpenCollective</a>";
const storeLink =
  "<a href='https://shop.destinyitemmanager.com/' target='_blank' rel='noopener noreferrer'>Teespring</a>";

export default function Support() {
  return (
    <div className="dim-page dim-static-page">
      <h1>{t('Views.Support.Support')}</h1>
      <p>{t('Views.Support.FreeToDownload')}</p>
      <p
        dangerouslySetInnerHTML={{
          __html: t('Views.Support.OpenCollective', { link: openCollectiveLink })
        }}
      />
      <p>
        <span
          dangerouslySetInnerHTML={{
            __html: t('Views.Support.Teespring', { link: storeLink })
          }}
        />
      </p>
      <h2>{t('Views.Support.Sponsors')}</h2>
      <p>{t('Views.Support.SponsorsDetail')}</p>
      <div className="backers">
        {_.times(5, (index) => (
          <ExternalLink href={`https://opencollective.com/dim/sponsor/${index}/website`}>
            <img src={`https://opencollective.com/dim/sponsor/${index}/avatar.svg`} />
          </ExternalLink>
        ))}
      </div>
      <h2>{t('Views.Support.Backers')}</h2>
      <p>{t('Views.Support.BackersDetail')}</p>
      <div className="backers">
        {_.times(100, (index) => (
          <ExternalLink href={`https://opencollective.com/dim/backer/${index}/website`}>
            <img src={`https://opencollective.com/dim/backer/${index}/avatar.svg`} />
          </ExternalLink>
        ))}
      </div>
    </div>
  );
}
