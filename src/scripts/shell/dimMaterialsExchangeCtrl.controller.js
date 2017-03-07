import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp').controller('dimMaterialsExchangeCtrl', MaterialsController);


function MaterialsController($scope, dimItemService, dimStoreService, $state, dimFeatureFlags) {
  if (!dimFeatureFlags.materialsExchangeEnabled) {
    $state.go('inventory');
    return;
  }

  var vm = this;
  vm.repPool = {};
  vm.newRank = 0;
  vm.newExperience = 0;
  vm.GlimmerIcon = require('../../images/glimmer.png');

  vm.factions = [
    // 174528503, eris breaks things atm
    3871980777,
    1424722124,
    2778795080
  ];

  vm.characters = dimStoreService.getStores()
    .filter(function(character) {
      return !character.isVault;
    })
    .map(function(item) {
      var background = item.background;
      var icon = item.icon;
      var className = item.className;
      var genderRace = item.genderRace;
      var factions = item.progression.progressions.filter((faction) => {
        return vm.factions.includes(faction.hash);
      }).reduce(function(map, obj) {
        map[obj.hash] = obj;
        return map;
      }, {});
      return { background, icon, className, genderRace, factions };
    });

  if (vm.characters.length === 0) {
    $state.go('inventory');
    return;
  }

  vm.activeCharacter = vm.characters[0];
  vm.activeFaction = vm.activeCharacter.factions[1424722124];
  vm.setActiveFaction = function(hash) {
    vm.activeFaction = vm.activeCharacter.factions[hash];
    updateRanks();
  };

  vm.setActiveCharacter = function(character) {
    vm.activeCharacter = character;
    vm.setActiveFaction(vm.activeFaction.hash);
  };

  vm.toggleItem = function(item) {
    if (vm.repPool[item.hash]) {
      delete vm.repPool[item.hash];
    } else {
      vm.repPool[item.hash] = vm.calculateRep(item);
    }
    updateRanks();
  };

  function updateRanks() {
    // rank 1 = 1500
    // rank 2 = 2000
    // rank 3+ = 2500
    var total = 0;

    for (var key in vm.repPool) {
      total = total + vm.repPool[key];
    }

    var totalRank = total + vm.activeFaction.progressToNextLevel;
    vm.newRank = Math.floor((totalRank) / 2500) + vm.activeFaction.level;
    vm.newExperience = (totalRank % 2500);
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
    3164836592 // Wormspore
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
    return hashes.map(function(hash) {
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

  function mapXurItems(hashes) {
    var mappedItems = mapItems(hashes);
    if (mappedItems[1] && mappedItems[0] && mappedItems[0].amount) {
      mappedItems[1].amount = mappedItems[0].amount * 3;
    }
    return mappedItems;
  }

  function mapGunsmithItems(hashes) {
    var mappedItems = mapItems(hashes);
    if (mappedItems[0]) {
      mappedItems[0].amount = Math.floor(vm.glimmer / 1250) * 25;
    }
    return mappedItems;
  }

  function mapVariksItems(hashes) {
    var mappedItems = mapItems(hashes);
    if (mappedItems[1] && mappedItems[0] && mappedItems[0].amount) {
      mappedItems[1].amount = mappedItems[0].amount;
    }
    return mappedItems;
  }

  function mapErisItems(hashes) {
    var mappedItems = mapItems(hashes);
    if (mappedItems[1] && mappedItems[0] && mappedItems[0].amount) {
      mappedItems[1].amount = Math.floor(mappedItems[0].amount / 5);
    }
    return mappedItems;
  }

  vm.calculateRep = function(item) {
    var rep = 0;
    if (item && item.hash) {
      switch (item.hash) {
      case 211861343:
        rep = Math.floor(item.amount * 25);
        break;       // heavy ammo synth
      case 937555249:
        rep = Math.floor(item.amount / 5) * 100;  // motes of light
        break;
      case 928169143:
        rep = Math.floor(item.amount / 4) * 25;   // special ammo synth
        break;
      case 1542293174: // armor materials
      case 1898539128: // weapon parts
      case 1797491610: // Helium Filaments
      case 2882093969: // Spin Metal
      case 3242866270: // Relic Iron
      case 2254123540: // Spirit Bloom
      case 3164836592: // Wormspore
        rep = Math.floor(item.amount / 25) * 50;
        break;
      default:
        return '?';
      }
    }
    return rep;
  };
}
