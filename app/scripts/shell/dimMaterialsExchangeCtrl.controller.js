(function() {
  'use strict';

  angular.module('dimApp').controller('dimMaterialsExchangeCtrl', MaterialsController);

  MaterialsController.$inject = ['$scope', 'dimItemService', 'dimStoreService', '$state'];

  function MaterialsController($scope, dimItemService, dimStoreService, $state) {
    var vm = this;

    var stores = dimStoreService.getStores();

    if (stores.length === 0) {
      $state.go('inventory');
      return;
    }

    var materialsHashes = [
      211861343,  // heavy ammo synth
      928169143,  // special ammo synth
      937555249,  // motes of light
      1542293174, // armor materials
      1898539128  // weapon parts
    ];

    var planataryMatsHashes = [
      1797491610, // Helium Filaments
      2882093969, // Spin Metal
      3242866270, // Relic Iron
      2254123540, // Spirit Bloom
      3164836592, // Wormspore
    ];

    var xurMatsHashes = [
      1738186005, // strange coins
      211861343  // heavy ammo synth
    ];

    var variksMatsHashes = [
      3783295803, // Ether Seeds
      211861343  // heavy ammo synth
    ];

    var erisMatsHashes = [
      1043138475, // black wax idol
      211861343  // heavy ammo synth
    ];

    var gunSmithMatsHashes = [
      1898539128  // weapon parts
    ];



    vm.glimmer = dimStoreService.getVault().glimmer;
    vm.xurMats = mapXurItems(xurMatsHashes);
    vm.planataryMats = mapItems(planataryMatsHashes);
    vm.materials = mapItems(materialsHashes);
    vm.variksMats = mapVariksItems(variksMatsHashes);
    vm.erisMats = mapErisItems(erisMatsHashes);
    vm.gunSmithMats = mapGunsmithItems(gunSmithMatsHashes);

    function mapItems(hashes) {
      return hashes.map(function (hash) {
        var ret = angular.copy(dimItemService.getItem({
          hash: hash
        }));
        if (ret) {
          ret.amount = 0;
          dimStoreService.getStores().forEach(function (s) {
            ret.amount += s.amountOfItem(ret);
          });
        }
        return ret;
      }).filter((item) => !_.isUndefined(item));
    }

    function mapXurItems(hashes) {
      var mappedItems = mapItems(hashes);
      mappedItems[1].amount = mappedItems[0].amount * 3;
      return mappedItems;
    }

    function mapGunsmithItems(hashes) {
      var mappedItems = mapItems(hashes);
      mappedItems[0].amount = Math.floor(vm.glimmer / 1250) * 25;
      return mappedItems;
    }

    function mapVariksItems(hashes) {
      var mappedItems = mapItems(hashes);
      mappedItems[1].amount = mappedItems[0].amount;
      return mappedItems;
    }

    function mapErisItems(hashes) {
      var mappedItems = mapItems(hashes);
      mappedItems[1].amount = Math.floor(mappedItems[0].amount / 5);
      return mappedItems;
    }

    vm.calculateRep = function (item) {
      switch (item.hash) {
        case 211861343:
          return Math.floor(item.amount * 25);       // heavy ammo synth
        case 937555249:
          return Math.floor(item.amount / 5) * 100;  // motes of light
        case 928169143:
          return Math.floor(item.amount / 4) * 25;   // special ammo synth
        case 1542293174: // armor materials
        case 1898539128: // weapon parts
        case 1797491610: // Helium Filaments
        case 2882093969: // Spin Metal
        case 3242866270: // Relic Iron
        case 2254123540: // Spirit Bloom
        case 3164836592: // Wormspore
          return Math.floor(item.amount / 25) * 50;
        default:
          return '?';
      }
    };
  }
})();
