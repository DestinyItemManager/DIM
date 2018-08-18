import template from './developer.html';
import { IComponentOptions, IController } from 'angular';

export const DeveloperComponent: IComponentOptions = {
  template,
  controller: DeveloperCtrl,
  controllerAs: 'vm'
};

function DeveloperCtrl(this: IController) {
  const vm = this;

  vm.apiKey = localStorage.getItem('apiKey');
  vm.clientId = localStorage.getItem('oauthClientId');
  vm.clientSecret = localStorage.getItem('oauthClientSecret');
  vm.URL = window.location.origin;
  vm.URLRet = `${vm.URL}/return.html`;

  if (window.location.protocol === 'http:') {
    vm.warning = 'Bungie.net will not accept the http protocol. Serve over https:// and try again.';
  }

  vm.save = () => {
    localStorage.setItem('apiKey', vm.apiKey);
    localStorage.setItem('oauthClientId', vm.clientId);
    localStorage.setItem('oauthClientSecret', vm.clientSecret);
    window.location.href = `${window.location.origin}/index.html`;
  };
}
