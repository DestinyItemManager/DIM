import angular from 'angular';
import _ from 'underscore';
import { sum } from '../util';

import template from './storage.html';
import './storage.scss';
import { reportException } from '../exceptions';

function StorageController($scope, dimSettingsService, SyncService, GoogleDriveStorage, dimDestinyTrackerService, $timeout, $window, $q, $i18next, $stateParams, $state) {
  'ngInject';

  const vm = this;

  vm.settings = dimSettingsService;
  vm.syncService = SyncService;
  vm.adapterStats = {};
  vm.googleApiBlocked = !window.gapi;
  vm.canClearIgnoredUsers = ($DIM_FLAVOR === 'dev');

  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  vm.supportsExport = !iOS;

  function dataStats(data) {
    const taggedItems = sum(Object.keys(data)
                            .filter((k) => k.startsWith('dimItemInfo'))
                            .map((k) => _.size(data[k])));

    return {
      Loadouts: _.size(data['loadouts-v3.0']),
      TagNotes: taggedItems,
      Settings: _.size(data['settings-v1.0']),
      IgnoredUsers: _.size(data.ignoredUsers)
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
    if ($window.confirm($i18next.t('Storage.GDriveSignInWarning'))) {
      return GoogleDriveStorage.authorize()
        .then(vm.forceSync)
        .catch((e) => {
          $window.alert($i18next.t('Storage.GDriveSignInError') + e.message);
          reportException('Google Drive Signin', e);
        });
    }
    return null;
  };

  vm.driveLogout = function() {
    $window.alert($i18next.t('Storage.GDriveLogout'));
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
      $window.alert($i18next.t('Storage.ImportSuccess'));
    };
    const file = angular.element(document.getElementById('importFile'))[0].files[0];
    if (file) {
      reader.readAsText(file);
    } else {
      $window.alert($i18next.t('Storage.ImportNoFile'));
    }
  };

  $scope.$on('gdrive-sign-in', () => {
    if ($stateParams.gdrive === 'true') {
      vm.forceSync().then(() => $state.go('settings', { gdrive: undefined }, 'replace'));
    }
  });

  vm.browserMayClearData = true;
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then((persistent) => {
      vm.browserMayClearData = !persistent;
    });
  }

  vm.clearIgnoredUsers = function() {
    if (!vm.canClearIgnoredUsers) {
      return;
    }

    dimDestinyTrackerService.clearIgnoredUsers();
  };
}

export const StorageComponent = {
  controller: StorageController,
  template: template
};
