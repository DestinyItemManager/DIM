import { module } from 'angular';

import { ClickAnywhereButHere } from './click-anywhere-but-here.directive';
import { FontAwesomeIcon } from './font-awesome-icon.directive';
import dimAngularFiltersModule from './dimAngularFilters.filter';
import { ToasterContainerComponent } from './toaster-container.component';

export const ShellModule = module('dimShell', [dimAngularFiltersModule])
  .component('dimToasterContainer', ToasterContainerComponent)
  .directive('fontAwesomeIcon', FontAwesomeIcon)
  .directive('dimClickAnywhereButHere', ClickAnywhereButHere).name;
