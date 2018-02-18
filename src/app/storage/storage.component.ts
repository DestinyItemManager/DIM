import { StateParams, StateService } from '@uirouter/angularjs';
import {
  element,
  IQService,
  IScope,
  ITimeoutService,
  IWindowService
  } from 'angular';
import * as _ from 'underscore';
import { reportException } from '../exceptions';
import { settings } from '../settings/settings';
import { sum } from '../util';
import template from './storage.html';
import './storage.scss';
import { StorageAdapter, SyncService } from './sync.service';

declare global {
  interface Window {
    MSStream: any;
  }
}

function StorageController(
  $scope: IScope,
  dimDestinyTrackerService,
  $timeout: ITimeoutService,
  $window: IWindowService,
  $q: IQService,
  $i18next,
  $stateParams: StateParams,
  $state: StateService
) {
  'ngInject';

  const vm = this;

  vm.settings = settings;
  vm.syncService = SyncService;
  vm.adapterStats = {};
  vm.googleApiBlocked = !window.gapi;
  vm.canClearIgnoredUsers = ($DIM_FLAVOR === 'dev');

  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  vm.supportsExport = !iOS;

  function dataStats(data) {
    const taggedItems = sum(Object.keys(data)
                            .filter((k) => k.startsWith('dimItemInfo'))
                            .map((k) => _.size(data[k])), (v) => v);

    return {
      Loadouts: _.size(data['loadouts-v3.0']),
      TagNotes: taggedItems,
      Settings: _.size(data['settings-v1.0']),
      IgnoredUsers: _.size(data.ignoredUsers)
    };
  }

  function refreshAdapter(adapter: StorageAdapter) {
    if (adapter.enabled) {
      return $q.when(adapter.get())
        .then((data) => {
          vm.adapterStats[adapter.name] = data ? dataStats(data) : null;
        })
        .catch(() => {
          vm.adapterStats[adapter.name] = null;
        });
    } else {
      vm.adapterStats[adapter.name] = null;
    }
    return null;
  }

  SyncService.adapters.forEach((adapter) => {
    $scope.$watch(() => adapter.enabled, () => {
      refreshAdapter(adapter);
    });
  });

  vm.forceSync = () => {
    return SyncService.get(true)
      .then((data) => SyncService.set(data, true))
      .then(() => $q.all(SyncService.adapters.map(refreshAdapter)));
  };

  vm.driveSync = () => {
    if ($window.confirm($i18next.t('Storage.GDriveSignInWarning'))) {
      return SyncService.GoogleDriveStorage.authorize()
        .then(vm.forceSync)
        .catch((e) => {
          $window.alert($i18next.t('Storage.GDriveSignInError') + e.message);
          reportException('Google Drive Signin', e);
        });
    }
    return null;
  };

  vm.driveLogout = () => {
    $window.alert($i18next.t('Storage.GDriveLogout'));
    return SyncService.GoogleDriveStorage.revokeDrive();
  };

  vm.exportData = () => {
    // Function to download data to a file
    function download(data, filename, type) {
      const a = document.createElement("a");
      const file = new Blob([data], { type });
      const url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      $timeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
    }

    SyncService.get().then((data) => {
      download(JSON.stringify(data), 'dim-data.json', 'application/json');
    });
  };

  vm.importData = () => {
    const reader = new FileReader();
    reader.onload = () => {
      // TODO: we're kinda trusting that this is the right data here, no validation!
      SyncService.set(JSON.parse(reader.result), true)
        .then(() => $q.all(SyncService.adapters.map(refreshAdapter)));
      $window.alert($i18next.t('Storage.ImportSuccess'));
    };
    const file = (element(document.getElementById('importFile')!)[0] as HTMLInputElement).files![0];
    if (file) {
      reader.readAsText(file);
    } else {
      $window.alert($i18next.t('Storage.ImportNoFile'));
    }
  };

  $scope.$on('gdrive-sign-in', () => {
    if ($stateParams.gdrive === 'true') {
      vm.forceSync().then(() => $state.go('settings', { gdrive: undefined }, { location: 'replace' }));
    }
  });

  vm.browserMayClearData = true;
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then((persistent) => {
      vm.browserMayClearData = !persistent;
    });
  }

  vm.clearIgnoredUsers = () => {
    if (!vm.canClearIgnoredUsers) {
      return;
    }

    dimDestinyTrackerService.clearIgnoredUsers();
  };
}

export const StorageComponent = {
  controller: StorageController,
  template
};
