import angular from 'angular';

import { IndexedDBStorage } from './indexed-db-storage';
import { ChromeSyncStorage } from './chrome-sync-storage';
import { GoogleDriveStorage } from './google-drive-storage';
import { SyncService } from './sync.service';
import { StorageComponent } from './storage.component';

export default angular
  .module('storageModule', [])
  .factory('IndexedDBStorage', IndexedDBStorage)
  .factory('ChromeSyncStorage', ChromeSyncStorage)
  .factory('GoogleDriveStorage', GoogleDriveStorage)
  .factory('SyncService', SyncService)
  .component('storage', StorageComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'storage',
      parent: 'content',
      component: 'storage',
      url: '/storage'
    });
  })
  .name;
