import { StateParams, StateService } from '@uirouter/angularjs';
import {
  element,
  IQService,
  IScope,
  ITimeoutService,
  IWindowService,
  IComponentOptions,
  IController
  } from 'angular';
import * as _ from 'underscore';
import { reportException } from '../exceptions';
import { settings } from '../settings/settings';
import { sum, count } from '../util';
import template from './storage.html';
import './storage.scss';
import { StorageAdapter, SyncService } from './sync.service';
import { clearIgnoredUsers } from '../destinyTrackerApi/userFilter';

declare global {
  interface Window {
    MSStream: any;
  }
}

export function dataStats(data) {
  const taggedItemsD1 = sum(Object.keys(data)
                          .filter((k) => k.startsWith('dimItemInfo') && k.endsWith("-d1"))
                          .map((k) => _.size(data[k])), (v) => v);
  const taggedItemsD2 = sum(Object.keys(data)
                          .filter((k) => k.startsWith('dimItemInfo') && k.endsWith("-d2"))
                          .map((k) => _.size(data[k])), (v) => v);

  const loadoutsD1 = count(data['loadouts-v3.0'] || [], (loadoutId: string) => data[loadoutId].destinyVersion !== 2);
  const loadoutsD2 = count(data['loadouts-v3.0'] || [], (loadoutId: string) => data[loadoutId].destinyVersion === 2);

  return {
    LoadoutsD1: loadoutsD1,
    LoadoutsD2: loadoutsD2,
    TagNotesD1: taggedItemsD1,
    TagNotesD2: taggedItemsD2,
    Settings: _.size(data['settings-v1.0']),
    IgnoredUsers: _.size(data.ignoredUsers)
  };
}

export const StorageComponent: IComponentOptions = {
  controller: StorageController,
  template
};

function StorageController(
  this: IController,
  $scope: IScope,
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

  vm.quota = null;
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then((quota: { quota: number; usage: number }) => {
      if (quota.usage >= 0 && quota.quota >= 0) {
        vm.quota = quota;
      }
    });
  }

  vm.clearIgnoredUsers = () => {
    if (!vm.canClearIgnoredUsers) {
      return;
    }

    clearIgnoredUsers();
  };
}
