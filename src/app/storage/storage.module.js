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

    // TODO: This should probably inherit from a sort of "general" state that has nothing to do with a specific account
    // By doing it this way (parenting on "destiny1account") we preserve a lot of existing behavior around the header
    // but we will have to re-declare storage separately for destiny2account.
    $stateProvider.state({
      name: 'storage',
      parent: 'destiny1account',
      component: 'storage',
      url: '/storage'
    });
  })
  .name;
