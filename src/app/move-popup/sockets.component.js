import _ from 'underscore';
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

  vm.anyBestRatedUnselected = function(category) {
    let anyBestRatedAndUnselected = false;

    _.each(category.sockets, (socket) => {
      _.each(socket.plugOptions, (plugOption) => {
        if ((plugOption !== socket.plug) && plugOption.bestRated) {
          anyBestRatedAndUnselected = true;
        }
      });
    });

    return anyBestRatedAndUnselected;
  };
}
