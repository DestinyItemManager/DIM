/*jshint -W027*/

(function () {
  'use strict';

  angular.module('dimApp')
    .value('dimUserSystemIds', {
      xbl: null,
      psn: null
    })
    .value('dimConfig', {
      'membershipType': -1,
      'active': {}
    })
    .value('dimItemTier', {
      exotic: 'exotic',
      legendary: 'legendary',
      rare: 'rare',
      uncommon: 'uncommon',
      basic: 'basic'
    })
    .value('dimCategory', {
      Weapons: [
        'Primary',
        'Special',
        'Heavy',
      ],
      Armor: [
        'Helmet',
        'Gauntlets',
        'Chest',
        'Leg',
        'ClassItem',
      ],
      General: [
        'Emblem',
        'Armor',
        'Ghost',
        'Ship',
        'Vehicle',
        'Consumable',
        'Material'
      ]
    })
    .run(appRun);

  appRun.$inject = ['dimBungieService', 'dimUserSystemIds', 'dimConfig', '$window'];

  function appRun(dimBungieService, dimUserSystemIds, dimConfig, $window) {
    var platformData = null;
    var storeData = null;

    dimBungieService.loadBungieNetUser()
      .then(function (data) {
        var bungieUser = data.Response;

        if (bungieUser.gamerTag) {
          dimUserSystemIds.xbl = {
            id: bungieUser.gamerTag,
            type: 1,
            label: 'Xbox'
          };
        }

        if (bungieUser.psnId) {
          dimUserSystemIds.psn = {
            id: bungieUser.psnId,
            type: 2,
            label: 'PlayStation'
          };
        }

        dimConfig.active = dimUserSystemIds.xbl;

        // if (!_.isNull(dimUserSystemIds.psn.id))
        //   dimConfig.active = dimUserSystemIds.psn;
      });
  }
})();
