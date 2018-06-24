import uuidv4 from 'uuid/v4';
import { oauthClientId } from '../bungie-api/bungie-api-utils';
import template from './login.html';
import './login.scss';
import { Transition } from '@uirouter/react';
import { IController, IComponentOptions } from 'angular';

export const LoginComponent: IComponentOptions = {
  template,
  controller: LoginCtrl,
  controllerAs: 'vm',
  bindings: {
    transition: '<'
  }
};

function LoginCtrl(
  this: IController & {
    authorizationURL: string;
    transition: Transition;
  }
) {
  'ngInject';

  const vm = this;

  vm.$onInit = () => {
    localStorage.authorizationState = uuidv4();
    const clientId = oauthClientId();

    // TODO: dunno if this actually works
    const reauth = vm.transition.params().reauth;

    vm.authorizationURL = `https://www.bungie.net/en/OAuth/Authorize?client_id=${clientId}&response_type=code&state=${localStorage.authorizationState}${reauth ? '&reauth=true' : ''}`;
    console.log(vm.authorizationURL);
  };
}
