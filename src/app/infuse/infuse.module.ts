import { module } from 'angular';

import { InfuseComponent } from './infuse.component';
import InfuseItem from './InfuseItem';
import { react2angular } from 'react2angular';

export default module('infuseModule', [])
  .component('infuse', InfuseComponent)
  .component('dimSimpleItem', react2angular(InfuseItem, ['itemData'])).name;
