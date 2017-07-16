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

  vm.authorizationURL = `https://www.bungie.net/en/OAuth/Authorize?client_id=${clientId}&response_type=code&state=${localStorage.authorizationState}${reauth ? '&reauth=true' : ''}`;
}

