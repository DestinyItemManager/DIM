import React, { useState } from 'react';
import { t } from 'app/i18next-t';
import { oauthClientId } from '../bungie-api/bungie-api-utils';
import { v4 as uuidv4 } from 'uuid';
import './login.scss';
import HelpLink from 'app/dim-ui/HelpLink';
import { useLocation } from 'react-router';
import { parse } from 'simple-query-string';

const dimApiHelpLink =
  'https://github.com/DestinyItemManager/DIM/wiki/DIM-Sync-(new-storage-for-tags,-loadouts,-and-settings)';

export default function Login() {
  const { search } = useLocation();
  const { reauth } = parse(search);
  const authorizationState = uuidv4();
  localStorage.setItem('authorizationState', authorizationState);
  const clientId = oauthClientId();

  const isStandalone =
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  // iOS versions before 12.2 don't support logging in via standalone mode.
  const isOldiOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !/(OS (?!12_[0-1](_|\s))[1-9]+[2-9]+_\d?\d)/.test(navigator.userAgent);

  const authorizationURL = (reauth) =>
    `https://www.bungie.net/en/OAuth/Authorize?client_id=${clientId}&response_type=code&state=${authorizationState}${
      reauth ? '&reauth=true' : ''
    }`;

  const [apiPermissionGranted, setApiPermissionGranted] = useState(
    localStorage.getItem('dim-api-enabled') !== 'false'
  );

  if (isOldiOS && isStandalone) {
    return (
      <div className="billboard">
        <div className="content">
          <h1>{t('Views.Login.UpgradeiOS')}</h1>
          <p>{t('Views.Login.UpgradeExplanation')}</p>
        </div>
      </div>
    );
  }

  localStorage.setItem('dim-api-enabled', JSON.stringify(apiPermissionGranted));

  const onApiPermissionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem('dim-api-enabled', JSON.stringify(event.target.checked));
    setApiPermissionGranted(event.target.checked);
  };

  return (
    <div className="billboard">
      <div className="content">
        <h1>{t('Views.Login.Permission')}</h1>
        <p>{t('Views.Login.Explanation')}</p>
        <p className="auth">
          <a rel="noopener noreferrer" href={authorizationURL(reauth)}>
            {t('Views.Login.Auth')}
          </a>
        </p>
        <div className="help">
          <input
            type="checkbox"
            id="apiPermissionGranted"
            name="apiPermissionGranted"
            checked={apiPermissionGranted}
            onChange={onApiPermissionChange}
          />
          <label htmlFor="apiPermissionGranted">
            {t('Storage.EnableDimApi')} <HelpLink helpLink={dimApiHelpLink} />
          </label>
          <div className="fineprint">{t('Storage.DimApiFinePrint')}</div>
        </div>
        <p className="help">
          <a
            rel="noopener noreferrer"
            href="https://github.com/DestinyItemManager/DIM/wiki/Authorizing-Destiny-Item-Manager-with-Bungie.net"
          >
            {t('Views.Login.LearnMore')}
          </a>
        </p>
        <p className="help">
          <a rel="noopener noreferrer" href={authorizationURL(true)}>
            {t('Views.Login.NewAccount')}
          </a>
        </p>
      </div>
    </div>
  );
}
