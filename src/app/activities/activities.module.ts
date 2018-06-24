import { module } from 'angular';

import { ActivitiesComponent } from './activities.component';

export default module('activitiesModule', [])
  .component('activities', ActivitiesComponent)
  .name;
