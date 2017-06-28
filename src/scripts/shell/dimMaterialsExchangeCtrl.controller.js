import angular from 'angular';
import _ from 'underscore';
import '../materials-exchange/materials-exchange.scss';

angular.module('dimApp').controller('dimMaterialsExchangeCtrl', MaterialsController);


function MaterialsController(dimDefinitions, dimItemService, dimStoreService, $state) {
  if (!$featureFlags.materialsExchangeEnabled) {
    $state.go('inventory');
    return;
  }

  const vm = this;

  vm.items = {};
  dimDefinitions.getDefinitions().then((defs) => {
    vm.items[3159615086] = defs.InventoryItem.get(3159615086);
  });

  vm.repPool = {};
  vm.newRank = 0;
  vm.newExperience = 0;

  vm.factions = [
    // 174528503, eris breaks things atm
    3871980777,
    1424722124,
    2778795080
  ];

  vm.characters = dimStoreService.getStores()
    .filter((character) => {
      return !character.isVault;
    })
    .map((item) => {
      const background = item.background;
      const icon = item.icon;
      const className = item.className;
      const genderRace = item.genderRace;
      const factions = item.progression.progressions.filter((faction) => {
        return vm.factions.includes(faction.hash);
      }).reduce((map, obj) => {
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
    let total = 0;

    for (const key in vm.repPool) {
      total = total + vm.repPool[key];
    }

    const totalRank = total + vm.activeFaction.progressToNextLevel;
    vm.newRank = Math.floor((totalRank) / 2500) + vm.activeFaction.level;
    vm.newExperience = (totalRank % 2500);
  }

  const materialsHashes = [
    211861343,  // heavy ammo synth
    928169143,  // special ammo synth
    937555249,  // motes of light
    1542293174, // armor materials
    1898539128  // weapon parts
  ];

  const planataryMatsHashes = [
    1797491610, // Helium Filaments
    2882093969, // Spin Metal
    3242866270, // Relic Iron
    2254123540, // Spirit Bloom
    3164836592 // Wormspore
  ];

  const xurMatsHashes = [
    1738186005, // strange coins
    211861343  // heavy ammo synth
  ];

  const variksMatsHashes = [
    3783295803, // Ether Seeds
    211861343  // heavy ammo synth
  ];

  const erisMatsHashes = [
    1043138475, // black wax idol
    211861343  // heavy ammo synth
  ];

  const gunSmithMatsHashes = [
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
    return hashes.map((hash) => {
      const ret = angular.copy(dimStoreService.getItemAcrossStores({
        hash: hash
      }));
      if (ret) {
        ret.amount = 0;
        dimStoreService.getStores().forEach((s) => {
          ret.amount += s.amountOfItem(ret);
        });
      }
      return ret;
    }).filter((item) => !_.isUndefined(item));
  }

  function mapXurItems(hashes) {
    const mappedItems = mapItems(hashes);
    if (mappedItems[1] && mappedItems[0] && mappedItems[0].amount) {
      mappedItems[1].amount = mappedItems[0].amount * 3;
    }
    return mappedItems;
  }

  function mapGunsmithItems(hashes) {
    const mappedItems = mapItems(hashes);
    if (mappedItems[0]) {
      mappedItems[0].amount = Math.floor(vm.glimmer / 1250) * 25;
    }
    return mappedItems;
  }

  function mapVariksItems(hashes) {
    const mappedItems = mapItems(hashes);
    if (mappedItems[1] && mappedItems[0] && mappedItems[0].amount) {
      mappedItems[1].amount = mappedItems[0].amount;
    }
    return mappedItems;
  }

  function mapErisItems(hashes) {
    const mappedItems = mapItems(hashes);
    if (mappedItems[1] && mappedItems[0] && mappedItems[0].amount) {
      mappedItems[1].amount = mappedItems[0].amount;
    }
    return mappedItems;
  }

  vm.calculateRep = function(item) {
    let rep = 0;
    if (item && item.hash) {
      switch (item.hash) {
      case 211861343: // heavy ammo synth
        rep = Math.floor(item.amount * 25);
        break;
      case 937555249: // motes of light
        rep = Math.floor(item.amount / 5) * 100;
        break;
      case 928169143: // special ammo synth
        rep = Math.floor(item.amount / 4) * 25;
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
