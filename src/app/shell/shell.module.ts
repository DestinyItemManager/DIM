import { module } from 'angular';

import { ClickAnywhereButHere } from './click-anywhere-but-here.directive';
import { FontAwesomeIcon } from './font-awesome-icon.directive';
import dimAngularFiltersModule from './dimAngularFilters.filter';
import { ToasterContainerComponent } from './toaster-container.component';
import { react2angular } from 'react2angular';
import RatingIcon from '../inventory/RatingIcon';

export const ShellModule = module('dimShell', [dimAngularFiltersModule])
  .component('dimToasterContainer', ToasterContainerComponent)
  .directive('fontAwesomeIcon', FontAwesomeIcon)
  .component('ratingIcon', react2angular(RatingIcon, ['rating']))
  .directive('dimClickAnywhereButHere', ClickAnywhereButHere).name;
