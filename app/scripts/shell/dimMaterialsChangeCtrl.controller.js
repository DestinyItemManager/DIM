(function() {
  'use strict';

  angular.module('dimApp').controller('dimMaterialsChangeCtrl', MaterialsController);

  SettingsController.$inject = ['dimSettingsService', '$scope', 'SyncService', 'dimCsvService', 'dimStoreService', 'dimInfoService', 'dimFeatureFlags'];

  function MaterialsController(settings, $scope, SyncService, dimCsvService, dimStoreService, dimInfoService, dimFeatureFlags) {
    var vm = this;

    var materialsHashes = [
            417308266, // three of coins
            211861343, // heavy ammo synth
            937555249, // motes of light
            1738186005, // strange coin?
            1542293174, // armor materials
            1898539128, // weapon parts
          ];

          self.consolidate = consolidateHashes.map(function(hash) {
            var ret = angular.copy(dimItemService.getItem({
              hash: hash
            }));
            if (ret) {
              ret.amount = 0;
              dimStoreService.getStores().forEach(function(s) {
                ret.amount += s.amountOfItem(ret);
              });
            }
            return ret;
          }).filter((item) => !_.isUndefined(item));

  }
})();
