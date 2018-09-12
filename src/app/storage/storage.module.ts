import { module } from 'angular';

import { StorageComponent } from './storage.component';
import { humanBytes } from './human-bytes';

export default module('storageModule', [])
  .component('storage', StorageComponent)
  .filter('humanBytes', () => humanBytes).name;
