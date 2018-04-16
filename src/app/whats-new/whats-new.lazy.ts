import { module } from 'angular';
import { react2angular } from 'react2angular';
import WhatsNew from './WhatsNew';

export default module('whatsNewModule', [])
  .component('whatsNew', react2angular(WhatsNew));
