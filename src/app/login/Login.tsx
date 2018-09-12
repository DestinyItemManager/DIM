import * as React from 'react';
import { Transition } from '@uirouter/react';
import { t } from 'i18next';
import { oauthClientId } from '../bungie-api/bungie-api-utils';
import uuidv4 from 'uuid/v4';
import './login.scss';

export default function Login({ transition }: { transition: Transition }) {
  const authorizationState = uuidv4();
  localStorage.setItem('authorizationState', authorizationState);
  const clientId = oauthClientId();
  const reauth = transition.params().reauth;
  const authorizationURL = `https://www.bungie.net/en/OAuth/Authorize?client_id=${clientId}&response_type=code&state=${authorizationState}${
    reauth ? '&reauth=true' : ''
  }`;

  return (
    <div className="billboard">
      <div className="content">
        <h1>{t('Views.Login.Permission')}</h1>
        <p>{t('Views.Login.Explanation')}</p>
        <p className="auth">
          <a rel="noopener noreferrer" href={authorizationURL}>
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
      </div>
    </div>
  );
}
