import template from './sockets.html';
import './sockets.scss';

export const SocketsComponent = {
  controller: SocketsCtrl,
  bindings: {
    sockets: '<',
    infuse: '&'
  },
  template
};

function SocketsCtrl($i18next) {
  'ngInject';

  const vm = this;

  vm.bestRatedText = `\n${$i18next.t('DtrReview.BestRatedTip')}`;
}