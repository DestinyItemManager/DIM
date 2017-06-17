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

  SyncService.get().then((data) => {
    vm.dataStats = dataStats(data);
  });

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
    return SyncService.get()
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
      var a = document.createElement("a");
      var file = new Blob([data], { type: type });
      var url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      $timeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
    }

    SyncService.get().then((data) => {
      download(JSON.stringify(data), 'dim-data.json', 'application/json');
    });
  };

  vm.importData = function() {
    var reader = new FileReader();
    reader.onload = function() {
      // TODO: we're kinda trusting that this is the right data here, no validation!
      SyncService.set(JSON.parse(reader.result), true);
      $window.alert("Imported DIM data!");
      $scope.$apply();
    };
    const file = angular.element('#importFile')[0].files[0];
    if (file) {
      reader.readAsText(file);
    } else {
      $window.alert("No File Selected!");
    }
  };
}

export const StorageComponent = {
  controller: StorageController,
  template: template
};
