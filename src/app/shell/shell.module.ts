import { module } from 'angular';

import { PageComponent } from './page.component';
import { ClickAnywhereButHere } from './click-anywhere-but-here.directive';
import { FontAwesomeIcon } from './font-awesome-icon.directive';
import loadingTracker from './dimLoadingTracker.factory';
import dimAngularFiltersModule from './dimAngularFilters.filter';
import { ToasterContainerComponent } from './toaster-container.component';

export const ShellModule = module('dimShell', [dimAngularFiltersModule])
  .factory('loadingTracker', loadingTracker)
  .component('dimPage', PageComponent)
  .component('dimToasterContainer', ToasterContainerComponent)
  .directive('fontAwesomeIcon', FontAwesomeIcon)
  .directive('dimClickAnywhereButHere', ClickAnywhereButHere).name;
