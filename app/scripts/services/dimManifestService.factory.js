(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimManifestService', ManifestService);

  ManifestService.$inject = ['$rootScope', '$q', 'dimBungieService', '$http'];

  function ManifestService($rootScope, $q, dimBungieService, $http) {
    return {
      getManifest: function() {
        // var language = window.navigator.language;
        var language = 'en';
        // Window.navigator.language
        // response is easy!

        dimBungieService.getManifest().then(function(data) {
          console.log(data);
          var version = data.version;
          var path = data.mobileWorldContentPaths[language] || data.mobileWorldContentPaths.en;
          $http.get("https://www.bungie.net/" + path, { responseType: "arraybuffer" })
            .then(function(response) {
              console.log(response);
            });
          // check sync service / local data for version?
          // download zip (correct language)
          // unzip
          // save sqlite in local
          // resolve promises for definitions? use a single promise for all
          // webworkers? or keep it sync
          // process items as promises?
        });
      }
    };
  }
})();
