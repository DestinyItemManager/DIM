import { module } from 'angular';

import { DeveloperComponent } from './developer.component';

export default module('developerModule', [])
  .component('dimDeveloper', DeveloperComponent)
  .name;
