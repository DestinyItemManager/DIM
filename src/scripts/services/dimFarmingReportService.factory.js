const angular = require('angular');
const _ = require('underscore');

angular.module('dimApp')
  .factory('dimFarmingReportService', FarmingReportService);

FarmingReportService.$inject = ['dimItemService', 'dimStoreService'];

  /**
   * A service for tracking farming related things.
   */
function FarmingReportService(dimItemService, dimStoreService) {
  var reportHashes = [
    269776572, // house banners
    3783295803, // ether seeds
    3632619276, // silken codex
    1043138475, // black wax idol
    2904517731, // axiomatic beads
    1772853454, // blue polyphage
    1932910919, // network keys
    3446457162, // resupply codes
    937555249, // motes of light
    1542293174, // armor materials
    1898539128, // weapon parts
    434054402, // exotic primary engram
    962768437, // exotic special engram
    786978913, // exotic heavy engram
    280603403, // exotic helmet engram
    2399969336, // exotic gauntlet engram
    504918462, // exotic chest engram
    151277314, // exotic leg engram
    197430987, // legendary primary engram
    2922774756, // legendary special engram
    1966937312, // legendary heavy engram
    3797169074, // legendary helmet engram
    3797169075, // legendary sublime helmet engram
    1986458097, // legendary gauntlet engram
    1986458096, // legendary sublime gauntlet engram
    2672986951, // legendary chest engram
    2672986950, // legendary sublime chest engram
    738642123, // legendary leg engram
    738642122, // legendary sublime leg engram
    808079384, // legendary class item engram
    808079385, // legendary sublime class item engram
    2895967264, // rare primary engram
    3441463739, // rare special engram
    2279897975, // rare heavy engram
    2655612993, // rare helmet engram
    3254227166, // rare gauntlet engram
    3232045548, // rare chest engram
    3452931616, // rare leg engram
    2644303887, // rare class item engram
    1797491610, // helium filaments
    3242866270, // relic iron
    2882093969, // spinmetal
    2254123540, // spirit bloom
    3164836593, // hadium flake
    605475555, // passage coin
    2206724918, // siva key fragments
    1738186005, // strange coin
    614056762 // skeleton key
  ];

  return {
    store: null,
    start: function(store) {
      var self = this;

      self.store = store;

      // set up all the starting values
      self.baseGlimmer = dimStoreService.getVault().glimmer;
      self.baseMarks = dimStoreService.getVault().legendaryMarks;

      self.baseRep = {};
      self.store.progression.progressions.forEach(function(rep) {
        if (rep.order && (rep.order >= 0)) {
          self.baseRep[rep.hash] = { level: rep.level, xp: rep.weeklyProgress };
        }
      });

      self.baseReport = {};
      reportHashes.forEach(function(hash) {
        self.baseReport[hash] = 0;
        const ret = angular.copy(dimItemService.getItem({
          hash: hash
        }));
        if (ret) {
          dimStoreService.getStores().forEach(function(s) {
            self.baseReport[hash] += s.amountOfItem(ret);
          });
        }
      });

      // the items we'll be showing in the UI
      self.glimmer = self.baseGlimmer;
      self.marks = self.baseMarks;
      self.report = [];
      self.reportCount = 0;
      self.rep = [];
    },
    farm: function() {
      var self = this;

      self.glimmer = Math.max(dimStoreService.getVault().glimmer - self.baseGlimmer, 0);
      self.marks = Math.max(dimStoreService.getVault().legendaryMarks - self.baseMarks, 0);

      self.report = reportHashes.map(function(hash) {
        const ret = angular.copy(dimItemService.getItem({
          hash: hash
        }));
        if (ret) {
          ret.farmReport = true;
          ret.amount = 0;
          dimStoreService.getStores().forEach(function(s) {
            ret.amount += s.amountOfItem(ret);
          });
          ret.amount -= self.baseReport[hash];
        }
        return ret;
      }).filter((item) => (!_.isUndefined(item) && (item.amount > 0)));

      self.reportCount = _.reduce(self.report, (memo, item) => (memo + item.amount), 0);

      self.rep = [];
      const store = dimStoreService.getStore(self.store.id);
      store.progression.progressions.forEach(function(rep) {
        if (rep.order && (rep.order >= 0)) {
          // NOTE: there's a bug if farming across the weekly reset. Do we care?
          const rankedUp = rep.level > self.baseRep[rep.hash].level;
          const gain = rep.weeklyProgress - self.baseRep[rep.hash].xp;
          if (gain > 0) {
            const item = angular.copy(rep);
            item.xpGain = gain;
            item.rankedUp = rankedUp;
            self.rep.push(item);
          }
        }
      });
    },
    stop: function() {
    },
    repClicked: function(rep) {
      var self = this;

      // clear the rank up notification and update the base's level
      if (rep.rankedUp) {
        self.baseRep[rep.hash].level = rep.level;
        rep.rankedUp = false;
      }
    }
  };
}
