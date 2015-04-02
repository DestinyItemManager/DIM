(function () {
  'use strict';

  angular.module('dimApp')
    .factory('dimBungieService', BungieService);

  BungieService.$inject = ['$rootScope', '$q', '$timeout', '$http'];

  function BungieService($rootScope, $q, $timeout, $http) {
    var apiKey = '57c5ff5864634503a0340ffdfbeb20c0';
    var tokenPromise = null;
    var platformPromise = null;
    var membershipPromise = null;
    var charactersPromise = null;

    $rootScope.$on('dim-active-platform-updated', function (event, args) {
      tokenPromise = null;
      platformPromise = null;
      membershipPromise = null;
      charactersPromise = null;
    });

    var service = {
      getPlatforms: getPlatforms,
      getStores: getStores
    };

    return service;

    function assignResultAndForward(dataset, attribute, result) {
      dataset[attribute] = result;

      return result;
    }

    function networkError(response) {
      if (response.status >= 200 && response.status < 400) {
        return response;
      } else {
        return $q.reject('Network error: ' + response.status);
      }
    }

    function throttleCheck(response) {
      return $q(function(resolve, reject) {
        if (response.ErrorCode !== 36) {
          resolve(response);
        } else {
          $timeout(function() {
            reject({
              errorCode: 36,
              message: 'Throttle limit exceeded.  Retry.'
            });
          }, 1000);
        }
      });
    }

    /************************************************************************************************************************************/

    function getBnetCookies() {
      return $q(function (resolve, reject) {
        chrome.cookies.getAll({
          'domain': '.bungie.net'
        }, getAllCallback);

        function getAllCallback(cookies) {
          if (_.size(cookies) > 0) {
            resolve(cookies);
          } else {
            reject('No cookies found.');
          }
        }
      });
    }

    /************************************************************************************************************************************/

    function getBungleToken() {
      tokenPromise = tokenPromise || getBnetCookies()
        .then(function (cookies) {
          return $q(function (resolve, reject) {
            var cookie = _.find(cookies, function (cookie) {
              return cookie.name === 'bungled';
            });

            if (!_.isUndefined(cookie)) {
              resolve(cookie.value);
            } else {
              if (_.isUndefined(location.search.split('reloaded')[1])) {
                chrome.tabs.create({
                  url: 'http://bungie.net',
                  active: false
                });

                setTimeout(function () {
                  window.location = window.location.origin + window.location.pathname + "?reloaded=true" + window.location.hash;
                }, 5000);
              }

              reject('No bungled cookie found.');
            }
          });
        })
        .catch(function (error) {
          tokenPromise = null;
        });

      return tokenPromise;
    }

    /************************************************************************************************************************************/

    function getPlatforms() {
      platformPromise = platformPromise || getBungleToken()
        .then(getBnetPlatformsRequest)
        .then($http)
        .then(networkError)
        .then(throttleCheck)
        .then(processBnetPlatformsRequest, rejectBnetPlatformsRequest);

      return platformPromise;
    }

    function getBnetPlatformsRequest(token) {
      return {
        method: 'GET',
        url: 'https://www.bungie.net/Platform/User/GetBungieNetUser/',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token
        },
        withCredentials: true
      };
    }

    function processBnetPlatformsRequest(response) {
      if (response.data.ErrorCode === 99) {
        return ($q.reject("Please log into Bungie.net before using this extension."));
      }

      return (response);
    }

    function rejectBnetPlatformsRequest(error) {
      return $q.reject("Message missing.");
    }

    /************************************************************************************************************************************/

    function getMembership(platform) {
      membershipPromise = membershipPromise || getBungleToken()
        .then(getBnetMembershipReqest.bind(null, platform))
        .then($http)
        .then(networkError)
        .then(throttleCheck)
        .then(processBnetMembershipRequest, rejectBnetMembershipRequest)
        .catch(function (error) {
          membershipPromise = null;
        });

      return membershipPromise;
    }

    function getBnetMembershipReqest(platform, token) {
      return $q.when((function () {
        return {
          method: 'GET',
          url: 'https://www.bungie.net/Platform/Destiny/SearchDestinyPlayer/' + platform.type + '/' + platform.id + '/',
          headers: {
            'X-API-Key': apiKey,
            'x-csrf': token
          },
          withCredentials: true
        };
      })());
    }

    function processBnetMembershipRequest(response) {
      if (_.size(response.data.Response) === 0) {
        return $q.reject('The membership id was not available.');
      }

      return $q.when(response.data.Response[0].membershipId);
    }

    function rejectBnetMembershipRequest(response) {
      return $q.reject('The membership id request failed.');
    }

    /************************************************************************************************************************************/

    function getCharacters(platform) {
      var data = {
        token: null,
        membershipId: null
      };

      var addTokenToData = assignResultAndForward.bind(null, data, 'token');
      var addMembershipIdToData = assignResultAndForward.bind(null, data, 'membershipId');
      var getMembershipPB = getMembership.bind(null, platform);

      charactersPromise = charactersPromise || getBungleToken()
        .then(addTokenToData)
        .then(getMembershipPB)
        .then(function (membershipId) {
          return getBnetCharactersRequest(data.token, platform, membershipId);
        })
        .then($http)
        .then(networkError)
        .then(throttleCheck)
        .then(processBnetCharactersRequest, rejectBnetCharactersRequest);

      return charactersPromise;
    }

    function getBnetCharactersRequest(token, platform, membershipId) {
      return $q.when((function () {
        return {
          method: 'GET',
          url: 'https://www.bungie.net/Platform/Destiny/Tiger' + (platform.type == 1 ? 'Xbox' : 'PSN') + '/Account/' + membershipId + '/',
          headers: {
            'X-API-Key': apiKey,
            'x-csrf': token
          },
          withCredentials: true
        };
      })());
    }

    function processBnetCharactersRequest(response) {
      if (_.size(response.data.Response) === 0) {
        $q.reject('The membership id was not available.');
      }

      return $q.when((function () {
        return _.map(response.data.Response.data.characters, function (character) {
          return {
            'id': character.characterBase.characterId,
            'base': character
          };
        });
      })());
    }

    function rejectBnetCharactersRequest(response) {
      $q.reject('The characters request failed.');
    }

    /************************************************************************************************************************************/

    function getStores(platform) {
      var data = {
        token: null,
        membershipId: null
      };

      var addTokenToData = assignResultAndForward.bind(null, data, 'token');
      var addMembershipIdToData = assignResultAndForward.bind(null, data, 'membershipId');
      var addCharactersToData = assignResultAndForward.bind(null, data, 'characters');
      var getMembershipPB = getMembership.bind(null, platform);
      var getCharactersPB = getCharacters.bind(null, platform);

      var promise = getBungleToken()
        .then(addTokenToData)
        .then(getMembershipPB)
        .then(addMembershipIdToData)
        .then(getCharactersPB)
        .then(addCharactersToData)
        .then(function () {
          return getDestinyInventories(data.token, platform, data.membershipId, data.characters);
        });

      return promise;
    }

    function getGuardianInventoryRequest(token, platform, membershipId, character) {
      return {
        method: 'GET',
        url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/Account/' + membershipId + '/Character/' + character.id + '/Inventory/?definitions=true',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token
        },
        withCredentials: true
      };
    }

    function getDestinyVaultRequest(token, platform) {
      return {
        method: 'GET',
        url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/MyAccount/Vault/?definitions=true',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token
        },
        withCredentials: true
      };
    }

    function processInventoryResponse(character, response) {
      var payload = response.data.Response;

      payload.id = character.id;
      payload.character = character;

      return $q.when(payload);
    }

    function rejectInventoryResponse(error) {
      $q.reject('The store inventory was not available.');
    }

    function getDestinyInventories(token, platform, membershipId, characters) {
      var promises = [];
      var promise;
      var processPB;

      // Guardians
      _.each(characters, function (character) {
        processPB = processInventoryResponse.bind(null, character);

        promise = $q.when(getGuardianInventoryRequest(token, platform, membershipId, character))
          .then($http)
          .then(networkError)
          .then(throttleCheck)
          .then(processPB, rejectInventoryResponse);

        promises.push(promise);
      });

      // Vault

      processPB = processInventoryResponse.bind(null, {
        id: 'vault',
        base: null
      });
      promise = $q.when(getDestinyVaultRequest(token, platform))
        .then($http)
        .then(networkError)
        .then(throttleCheck)
        .then(processPB, rejectInventoryResponse);

      promises.push(promise);

      return $q.all(promises);
    }
  }
})();
