(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimFarmingReportService', FarmingReportService);

  FarmingReportService.$inject = ['dimItemService', 'dimStoreService', '$interval'];

    /**
     * A service for tracking farming related things.
     */
  function FarmingReportService(dimItemService, dimStoreService, $interval) {
    var intervalId;
    var startTime;
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
      1738186005, // motes of light
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

    function pad(val) {
      return val > 9 ? val : "0" + val;
    }

    return {
      start: function() {
        var self = this;

        self.elapsed = "00:00:00";
        startTime = new Date();
        intervalId = $interval(function() {
          var endTime = new Date();
          var timeDiff = endTime - startTime;

            // strip the milliseconds
          timeDiff /= 1000;

            // get seconds
          var seconds = Math.round(timeDiff % 60);
          timeDiff = Math.floor(timeDiff / 60);

            // get minutes
          var minutes = Math.round(timeDiff % 60);
          timeDiff = Math.floor(timeDiff / 60);

            // get hours
          var hours = Math.round(timeDiff % 24);

          self.elapsed = pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
        }, 1000);

        self.baseGlimmer = dimStoreService.getVault().glimmer;
        self.baseMarks = dimStoreService.getVault().legendaryMarks;
        self.baseReport = {};
        reportHashes.forEach(function(hash) {
          self.baseReport[hash] = 0;
          var ret = angular.copy(dimItemService.getItem({
            hash: hash
          }));
          if (ret) {
            dimStoreService.getStores().forEach(function(s) {
              self.baseReport[hash] += s.amountOfItem(ret);
            });
          }
        });

        self.report = [];
        self.glimmer = self.baseGlimmer;
        self.marks = self.baseMarks;
      },
      farm: function() {
        var self = this;

        self.report = reportHashes.map(function(hash) {
          var ret = angular.copy(dimItemService.getItem({
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

        self.glimmer = Math.max(dimStoreService.getVault().glimmer - self.baseGlimmer, 0);
        self.marks = Math.max(dimStoreService.getVault().legendaryMarks - self.baseMarks, 0);
      },
      stop: function() {
        if (intervalId) {
          $interval.cancel(intervalId);
        }
      }
    };
  }
})();