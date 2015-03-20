(function () {
  'use strict';

  angular.module('dimApp')
    .controller('dimAppController', AppController);

  AppController.$inject = ['$scope', 'dimBungieService', 'dimUserSystemIds', 'dimConfig', '$window'];

  function AppController($scope, dimBungieService, dimUserSystemIds, dimConfig, $window) {
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
