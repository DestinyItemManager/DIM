import * as React from 'react';
import { t } from 'i18next';
import * as _ from 'lodash';
import './page.scss';

const openCollectiveLink =
  "<a href='https://opencollective.com/dim' target='_blank' rel='noopener noreferrer'>OpenCollective</a>";
const storeLink =
  "<a href='https://shop.destinyitemmanager.com/' target='_blank' rel='noopener noreferrer'>Teespring</a>";

export default class Support extends React.PureComponent {
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
        <p>{t('Views.Support.BackersDetail')}</p>
        <div id="opencollective" />
      </div>
    );
  }
}
