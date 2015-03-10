(function () {
  angular.module('dimApp')
    .factory('dimBungieService', BungieService);

  BungieService.$inject = ['$http', '$q', 'dimUserSystemIds', 'dimActiveId'];

  function BungieService($http, $q, dimUserSystemIds, dimActiveId) {
    return {
      getUser: getUser
    };

    function getUser() {
      getCookies()
        .then(getBungleToken)
        .then(generateUserRequest)
        .then(getUserComplete)
        .catch(getUserFailed);

      function generateUserRequest(token) {
        var request = {
          method: 'GET',
          url: 'https://www.bungie.net/Platform/User/GetBungieNetUser/',
          headers: {
            'X-API-Key': '57c5ff5864634503a0340ffdfbeb20c0',
            'x-csrf': token
          },
          withCredentials: true
        };

        return $http(request);
      }

      function getUserComplete(response) {
        var bungieUser = response.data.Response;

        dimUserSystemIds.xbl.id = bungieUser.gamerTag;
        dimUserSystemIds.xbl.type = 1;

        dimUserSystemIds.psn.id = bungieUser.psnId;
        dimUserSystemIds.psn.type = 2;

        dimActiveId = dimUserSystemIds.xbl;

        if (!_.isNull(dimUserSystemIds.psn.id))
          dimActiveId = dimUserSystemIds.psn;
      }

      function getUserFailed(response) {
        console.log('XHR Failed for getUser. ' + response);
      }

      function getCookies() {
        return $q(function (resolve, reject) {
          function getAllCallback(cookies) {
            if (_.size(cookies) > 0) {
              resolve(cookies);
            } else {
              reject('No cookies found.');
            }
          }

          chrome.cookies.getAll({
            'domain': '.bungie.net'
          }, getAllCallback);
        });
      }

      function getBungleToken(cookies) {
        return $q(function (resolve, reject) {
          var cookie = _.find(cookies, function (cookie) {
            return cookie.name === 'bungled';
          });

          if (!_.isUndefined(cookie)) {
            resolve(cookie.value);
          } else {
            chrome.tabs.create({ url: 'http://bungie.net', active: false });
            setTimeout(function() { window.location.reload(); }, 5000);

            reject('No bungled cookie found.');
          }
        });
        var d = $q.defer();
      }
    }
  }
})();
