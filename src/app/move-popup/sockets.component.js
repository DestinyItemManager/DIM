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

function SocketsCtrl() {
  'ngInject';
}