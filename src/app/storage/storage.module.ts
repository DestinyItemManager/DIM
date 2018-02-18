import { module } from 'angular';

import { SyncService } from './sync.service';
import { StorageComponent } from './storage.component';

export default module('storageModule', [])
  .factory('SyncService', SyncService)
  .component('storage', StorageComponent)
  .name;
