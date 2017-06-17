import angular from 'angular';
import template from './storage.html';
import './storage.scss';
import { sum } from '../util';

function StorageController($scope, dimSettingsService, SyncService, $timeout, $window, $q) {
  'ngInject';

  const vm = this;

  vm.settings = dimSettingsService;
  vm.syncService = SyncService;
  vm.adapterStats = {};

  function dataStats(data) {
    const taggedItems = sum(Object.keys(data)
                            .filter((k) => k.startsWith('dimItemInfo'))
                            .map((k) => Object.keys(data[k]).length));

    return {
      Loadouts: data['loadouts-v3.0'].length,
      TagNotes: taggedItems,
      Settings: Object.keys(data['settings-v1.0']).length
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
    // TODO: talk directly to the google adapter
    // TODO: warn users that their data could be overridden, back up
    return SyncService.authorizeGdrive();
  };

  vm.driveLogout = function() {
    // TODO: explain that the data will still be there
    return SyncService.logoutGdrive();
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
    reader.readAsText(angular.element('#importFile')[0].files[0]);
  };
}

export const StorageComponent = {
  controller: StorageController,
  template: template
};
