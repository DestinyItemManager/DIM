import React from 'react';
import { Transition } from '@uirouter/react';
import { t } from 'app/i18next-t';
import { oauthClientId } from '../bungie-api/bungie-api-utils';
import uuidv4 from 'uuid/v4';
import './login.scss';

export default function Login({ transition }: { transition: Transition }) {
  const authorizationState = uuidv4();
  localStorage.setItem('authorizationState', authorizationState);
  const clientId = oauthClientId();
  const reauth = transition.params().reauth;

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
