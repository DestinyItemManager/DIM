import angular from 'angular';

import { IndexedDBStorage } from './indexed-db-storage';
import { GoogleDriveStorage } from './google-drive-storage';
import { SyncService } from './sync.service';
import { StorageComponent } from './storage.component';

export default angular
  .module('storageModule', [])
  .factory('IndexedDBStorage', IndexedDBStorage)
  .factory('GoogleDriveStorage', GoogleDriveStorage)
  .factory('SyncService', SyncService)
  .component('storage', StorageComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'storage',
      component: 'storage',
      url: '/storage?gdrive'
    });
  })
  .name;
