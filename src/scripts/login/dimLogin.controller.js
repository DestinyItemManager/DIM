import angular from 'angular';
import uuidv4 from 'uuid/v4';
import './login.scss';
import { oauthClientId } from '../services/bungie-api-utils';

angular.module('dimApp')
  .controller('dimLoginCtrl', dimLoginCtrl);

function dimLoginCtrl() {
  const vm = this;

  localStorage.authorizationState = uuidv4();
  const clientId = oauthClientId();

  vm.authorizationURL = `https://www.bungie.net/en/OAuth/Authorize?client_id=${clientId}&response_type=code&state=${localStorage.authorizationState}`;
}

