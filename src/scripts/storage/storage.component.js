import angular from 'angular';
import _ from 'underscore';
import { sum } from '../util';

import template from './storage.html';
import './storage.scss';

function StorageController($scope, dimSettingsService, SyncService, GoogleDriveStorage, $timeout, $window, $q, $translate) {
  'ngInject';

  const vm = this;

  vm.settings = dimSettingsService;
  vm.syncService = SyncService;
  vm.adapterStats = {};

  function dataStats(data) {
    const taggedItems = sum(Object.keys(data)
                            .filter((k) => k.startsWith('dimItemInfo'))
                            .map((k) => _.size(data[k])));

    return {
      Loadouts: _.size(data['loadouts-v3.0']),
      TagNotes: taggedItems,
      Settings: _.size(data['settings-v1.0'])
    };
  }

  function refreshAdapter(adapter) {
    if (adapter.enabled) {
      return adapter.get()
        .then((data) => {
          if (data) {
            vm.adapterStats[adapter.name] = dataStats(data);
          } else {
            vm.adapterStats[adapter.name] = null;
          }
        })
        .catch((e) => {
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

  vm.forceSync = function() {
    return SyncService.get(true)
      .then((data) => SyncService.set(data, true))
      .then(() => $q.all(SyncService.adapters.map(refreshAdapter)));
  };

  vm.driveSync = function() {
    if ($window.confirm($translate.instant('Storage.GDriveSignInWarning'))) {
      return GoogleDriveStorage.authorize();
    }
    return null;
  };

  vm.driveLogout = function() {
    $window.alert($translate.instant('Storage.GDriveLogout'));
    return GoogleDriveStorage.revokeDrive();
  };

  vm.exportData = function() {
    // Function to download data to a file
    function download(data, filename, type) {
      const a = document.createElement("a");
      const file = new Blob([data], { type: type });
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

  vm.importData = function() {
    const reader = new FileReader();
    reader.onload = function() {
      $scope.$apply(() => {
        // TODO: we're kinda trusting that this is the right data here, no validation!
        SyncService.set(JSON.parse(reader.result), true)
          .then(() => $q.all(SyncService.adapters.forEach(refreshAdapter)));
      });
      $window.alert($translate.instant('Storage.ImportSuccess'));
    };
    const file = angular.element('#importFile')[0].files[0];
    if (file) {
      reader.readAsText(file);
    } else {
      $window.alert($translate.instant('Storage.ImportNoFile'));
    }
  };

  vm.importDataFromExtension = function() {
    if ($window.confirm($translate.instant('Storage.ImportFromExtensionWarning'))) {
      return SyncService.set(vm.extensionData, true)
        .then(() => $q.all(SyncService.adapters.map(refreshAdapter)));
    }
    return null;
  };

  function messageHandler(event) {
    // We only accept messages from ourselves
    if (event.source !== window) {
      return;
    }

    switch (event.data.type) {
    case 'DIM_EXT_PONG':
      vm.supportsExtensionImport = true;
      console.log('pong!');
      window.postMessage({ type: 'DIM_GET_DATA' }, "*");
      break;

    case 'DIM_DATA_RESPONSE':
      console.log('data response', event);
      vm.extensionData = event.data.data;
      vm.extensionDataStats = dataStats(vm.extensionData);
      break;
    }
  }

  window.addEventListener('message', messageHandler, false);
  window.postMessage({ type: 'DIM_EXT_PING' }, "*");

  $scope.$on('$destroy', () => {
    window.removeEventListener('message', messageHandler);
  });
}

export const StorageComponent = {
  controller: StorageController,
  template: template
};
