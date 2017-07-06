import uuidv4 from 'uuid/v4';
import { oauthClientId } from '../bungie-api/bungie-api-utils';
import template from './login.html';
import './login.scss';

export const LoginComponent = {
  template,
  controller: LoginCtrl,
  controllerAs: 'vm'
};

function LoginCtrl($stateParams) {
  'ngInject';

  const vm = this;

  localStorage.authorizationState = uuidv4();
  const clientId = oauthClientId();

  const reauth = $stateParams.reauth;
  const loginUrl = `/en/OAuth/Authorize?client_id=${clientId}&response_type=code&state=${localStorage.authorizationState}`;

  if (reauth) {
    // TEMPORARY: fully log out from Bungie.net by redirecting to a special logout/relogin page
    // Soon, Bungie.net will respect the reauth parameter and we won't have to do this
    const logoutUrl = `https://www.bungie.net/en/User/SignOut?bru=${encodeURIComponent(loginUrl)}`;
    vm.authorizationURL = logoutUrl;
  } else {
    vm.authorizationURL = `https://www.bungie.net${loginUrl}${reauth ? '&reauth=true' : ''}`;
  }
}

