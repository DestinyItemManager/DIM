import { module } from 'angular';

import { StorageComponent } from './storage.component';
import { StateProvider } from '@uirouter/angularjs';
import { react2angular } from 'react2angular';
import GDriveRevisions from './GDriveRevisions';
import { humanBytes } from './human-bytes';

export default module('storageModule', [])
  .component('storage', StorageComponent)
  .component('gdriveRevisions', react2angular(GDriveRevisions, [], []))
  .filter('humanBytes', () => humanBytes)
  .config(($stateProvider: StateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'gdrive-revisions',
      component: 'gdriveRevisions',
      url: '/storage/gdrive-revisions'
    });
  })
  .name;
