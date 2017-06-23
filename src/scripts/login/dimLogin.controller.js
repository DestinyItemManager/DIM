import angular from 'angular';
import './login.scss';
import { oauthClientId } from '../services/bungie-api-utils';

angular.module('dimApp')
  .controller('dimLoginCtrl', dimLoginCtrl);

function dimLoginCtrl(uuid2) {
  const vm = this;

  localStorage.authorizationState = uuid2.newguid();
  const clientId = oauthClientId();

  vm.authorizationURL = `https://www.bungie.net/en/OAuth/Authorize?client_id=${clientId}&response_type=code&state=${localStorage.authorizationState}`;
}

