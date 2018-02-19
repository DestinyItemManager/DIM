import { module } from 'angular';

import { StorageComponent } from './storage.component';

export default module('storageModule', [])
  .component('storage', StorageComponent)
  .name;
