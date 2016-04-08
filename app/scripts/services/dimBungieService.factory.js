(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimBungieService', BungieService);

  BungieService.$inject = ['$rootScope', '$q', '$timeout', '$http', 'dimState', 'toaster'];

  function BungieService($rootScope, $q, $timeout, $http, dimState, toaster) {
    var apiKey = '57c5ff5864634503a0340ffdfbeb20c0';
    var tokenPromise = null;
    var platformPromise = null;
    var membershipPromise = null;

    $rootScope.$on('dim-active-platform-updated', function(event, args) {
      tokenPromise = null;
      platformPromise = null;
      membershipPromise = null;
    });

    var service = {
      getPlatforms: getPlatforms,
      getCharacters: getCharacters,
      getStores: getStores,
      transfer: transfer,
      equip: equip,
      equipItems: equipItems,
      setLockState: setLockState,
      getXur: getXur
    };

    return service;

    function assignResultAndForward(dataset, attribute, result) {
      dataset[attribute] = result;

      return result;
    }

    function handleErrors(response) {
      if (response.status < 200 || response.status >= 400) {
        return $q.reject(new Error('Network error: ' + response.status));
      }

      var errorCode = response.data.ErrorCode;
      if (errorCode === 36) {
        return $q.reject(new Error('Bungie API throttling limit exceeded. Please wait a bit and then retry.'));
      } else if (errorCode === 99) {
        return $q.reject(new Error('Please log into Bungie.net in order to use this extension.'));
      } else if (errorCode === 5) {
        return $q.reject(new Error('Bungie.net servers are down for maintenance.'));
      } else if (errorCode > 1) {
        return $q.reject(new Error(response.data.Message));
      }

      return response;
    }

    function retryOnThrottled(request) {
      var a = $q(function(resolve, reject) {
        var retries = 4;

        function run() {
          $http(request).then(function success(response) {
            if (response.data.ErrorCode === 36) {
              retries = retries - 1;

              if (retries <= 0) {
                // debugger;
                resolve(response);
              } else {
                $timeout(run, Math.pow(2, 4 - retries) * 1000);
              }
            } else {
              resolve(response);
            }
          }, function failure(response) {
            // debugger;
            reject(new Error(response.data.Message));
          });
        }

        run();
      });

      return a;
    }

    /************************************************************************************************************************************/

    function getBnetCookies() {
      return $q(function(resolve, reject) {
        chrome.cookies.getAll({
          'domain': '.bungie.net'
        }, getAllCallback);

        function getAllCallback(cookies) {
          if (_.size(cookies) > 0) {
            resolve(cookies);
          } else {
            reject(new Error('No cookies found.'));
          }
        }
      });
    }

    /************************************************************************************************************************************/

    function getBungleToken() {
      tokenPromise = tokenPromise || getBnetCookies()
        .then(function(cookies) {
          return $q(function(resolve, reject) {
            var cookie = _.find(cookies, function(cookie) {
              return cookie.name === 'bungled';
            });

            if (!_.isUndefined(cookie)) {
              resolve(cookie.value);
            } else {
              reject(new Error('Please log into Bungie.net in order to use this extension.'));
            }
          });
        })
        .catch(function(error) {
          tokenPromise = null;
        });

      return tokenPromise;
    }

    /************************************************************************************************************************************/

    function getPlatforms() {
      platformPromise = platformPromise || getBungleToken()
        .then(getBnetPlatformsRequest)
        .then($http)
        .then(handleErrors)
        .catch(function(e) {
          toaster.pop('error', '', e.message);

          return $q.reject(e);
        });

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

    function rejectBnetPlatformsRequest(error) {
      return $q.reject(new Error('Message missing.'));
    }

    /************************************************************************************************************************************/

    function getMembership(platform) {
      membershipPromise = membershipPromise || getBungleToken()
        .then(getBnetMembershipReqest.bind(null, platform))
        .then($http)
        .then(handleErrors)
        .then(processBnetMembershipRequest, rejectBnetMembershipRequest)
        .catch(function(error) {
          membershipPromise = null;
        });

      return membershipPromise;
    }

    function getBnetMembershipReqest(platform, token) {
      return {
        method: 'GET',
        url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/Stats/GetMembershipIdByDisplayName/' + platform.id + '/',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token
        },
        withCredentials: true
      };
    }

    function processBnetMembershipRequest(response) {
      if (_.size(response.data.Response) === 0) {
        return $q.reject(new Error('The membership id was not available.'));
      }

      return $q.when(response.data.Response);
    }

    function rejectBnetMembershipRequest(response) {
      return $q.reject(new Error('The membership id request failed.'));
    }

    /************************************************************************************************************************************/

    function getCharacters(platform) {
      var data = {
        token: null,
        membershipId: null
      };

      var addTokenToData = assignResultAndForward.bind(null, data, 'token');
      var getMembershipPB = getMembership.bind(null, platform);

      var charactersPromise = getBungleToken()
        .then(addTokenToData)
        .then(getMembershipPB)
        .then(function(membershipId) {
          return getBnetCharactersRequest(data.token, platform, membershipId);
        })
        .then(function(request) {
          return $http(request);
        })
        .then(handleErrors)
        .then(processBnetCharactersRequest);

      return charactersPromise;
    }

    function getBnetCharactersRequest(token, platform, membershipId) {
      return {
        method: 'GET',
        url: 'https://www.bungie.net/Platform/Destiny/Tiger' + (platform.type == 1 ? 'Xbox' : 'PSN') + '/Account/' + membershipId + '/',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token
        },
        withCredentials: true,
        transformResponse: function(data, headers) {
          return JSON.parse(data.replace(/:\s*NaN/i, ':0'));
        }
      };
    }

    function processBnetCharactersRequest(response) {
      if (_.size(response.data.Response) === 0) {
        return $q.reject(new Error('The membership id was not available.'));
      }

      return _.map(response.data.Response.data.characters, function(c) {
        c.inventory = response.data.Response.data.inventory;

        return {
          'id': c.characterBase.characterId,
          'base': c
        };
      });
    }


    /************************************************************************************************************************************/

    function getXur() {
      return $q.when({
        method: 'GET',
        url: 'https://www.bungie.net/Platform/Destiny/Advisors/Xur/',
        headers: {
          'X-API-Key': apiKey
        },
        withCredentials: true,
        transformResponse: function(data, headers) {
          return JSON.parse(data.replace(/:\s*NaN/i, ':0'));
        }
      })
      .then(function(request) {
        return $http(request);
      })
      .then(handleErrors)
      .then(function(response) {
        return response.data.Response.data;
      });
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
        .then(function() {
          return getDestinyInventories(data.token, platform, data.membershipId, data.characters);
        })
        .catch(function(e) {
          toaster.pop('error', '', e.message);

          return $q.reject(e);
        });

      return promise;
    }

    function getGuardianInventoryRequest(token, platform, membershipId, character) {
      return {
        method: 'GET',
        url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/Account/' + membershipId + '/Character/' + character.id + '/Inventory/?definitions=false',
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
        url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/MyAccount/Vault/?definitions=false',
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

      return payload;
    }

    function getDestinyInventories(token, platform, membershipId, characters) {
      // Guardians
      var promises = characters.map(function(character) {
        var processPB = processInventoryResponse.bind(null, character);

        return $q.when(getGuardianInventoryRequest(token, platform, membershipId, character))
          .then($http)
          .then(handleErrors)
          .then(processPB);
      });

      // Vault

      var processPB = processInventoryResponse.bind(null, {
        id: 'vault',
        base: null
      });

      var promise = $q.when(getDestinyVaultRequest(token, platform))
        .then($http)
        .then(handleErrors)
        .then(processPB);

      promises.push(promise);

      return $q.all(promises);
    }

    /************************************************************************************************************************************/

    function transfer(item, store, amount) {
      var platform = dimState.active;
      var data = {
        token: null,
        membershipType: null
      };

      var addTokenToDataPB = assignResultAndForward.bind(null, data, 'token');
      var addMembershipTypeToDataPB = assignResultAndForward.bind(null, data, 'membershipType');
      var getMembershipPB = getMembership.bind(null, platform);

      var promise = getBungleToken()
        .then(addTokenToDataPB)
        .then(getMembershipPB)
        .then(addMembershipTypeToDataPB)
        .then(function() {
          return store;
        })
        .then(function(store) {
          return getTransferRequest(data.token, platform.type, item, store, amount);
        })
        .then(retryOnThrottled)
        .then(handleErrors);

      return promise;
    }

    function getTransferRequest(token, membershipType, item, store, amount) {
      return {
        method: 'POST',
        url: 'https://www.bungie.net/Platform/Destiny/TransferItem/',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token,
          'content-type': 'application/json; charset=UTF-8;'
        },
        data: {
          characterId: store.isVault ? item.owner : store.id,
          membershipType: membershipType,
          itemId: item.id,
          itemReferenceHash: item.hash,
          stackSize: amount || item.amount,
          transferToVault: store.isVault
        },
        dataType: 'json',
        withCredentials: true
      };
    }

    /************************************************************************************************************************************/

    function equip(item) {
      var platform = dimState.active;
      var data = {
        token: null,
        membershipType: null
      };

      var addTokenToDataPB = assignResultAndForward.bind(null, data, 'token');
      var addMembershipTypeToDataPB = assignResultAndForward.bind(null, data, 'membershipType');
      var getMembershipPB = getMembership.bind(null, platform);

      var promise = getBungleToken()
        .then(addTokenToDataPB)
        .then(getMembershipPB)
        .then(addMembershipTypeToDataPB)
        .then(function() {
          return getEquipRequest(data.token, platform.type, item);
        })
        .then(retryOnThrottled)
        .then(handleErrors);

      return promise;
    }

    function getEquipRequest(token, membershipType, item) {
      return {
        method: 'POST',
        url: 'https://www.bungie.net/Platform/Destiny/EquipItem/',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token,
          'content-type': 'application/json; charset=UTF-8;'
        },
        data: {
          characterId: item.owner,
          membershipType: membershipType,
          itemId: item.id
        },
        dataType: 'json',
        withCredentials: true
      };
    }

    /************************************************************************************************************************************/

    // Returns a list of items that were successfully equipped
    function equipItems(store, items) {
      var platform = dimState.active;
      var data = {
        token: null,
        membershipType: null
      };

      var addTokenToDataPB = assignResultAndForward.bind(null, data, 'token');
      var addMembershipTypeToDataPB = assignResultAndForward.bind(null, data, 'membershipType');
      var getMembershipPB = getMembership.bind(null, platform);

      var promise = getBungleToken()
        .then(addTokenToDataPB)
        .then(getMembershipPB)
        .then(addMembershipTypeToDataPB)
        .then(function() {
          return {
            method: 'POST',
            url: 'https://www.bungie.net/Platform/Destiny/EquipItems/',
            headers: {
              'X-API-Key': apiKey,
              'x-csrf': data.token,
              'content-type': 'application/json; charset=UTF-8;'
            },
            data: {
              characterId: store.id,
              membershipType: platform.type,
              itemIds: _.pluck(items, 'id')
            },
            dataType: 'json',
            withCredentials: true
          };
        })
        .then(retryOnThrottled)
        .then(handleErrors)
        .then(function(response) {
          var data = response.data.Response;
          store.updateCharacterInfo(data.summary);
          return _.select(items, function(i) {
            var item = _.find(data.equipResults, {itemInstanceId: i.id});
            return item && item.equipStatus === 1;
          });
        });

      return promise;
    }

    /************************************************************************************************************************************/

    function setLockState(item, store, lockState) {
      var platform = dimState.active;
      var data = {
        token: null,
        membershipType: null
      };

      var addTokenToDataPB = assignResultAndForward.bind(null, data, 'token');
      var addMembershipTypeToDataPB = assignResultAndForward.bind(null, data, 'membershipType');
      var getMembershipPB = getMembership.bind(null, platform);

      var promise = getBungleToken()
        .then(addTokenToDataPB)
        .then(getMembershipPB)
        .then(addMembershipTypeToDataPB)
        .then(function() {
          return store;
        })
        .then(function(store) {
          return getSetLockStateRequest(data.token, platform.type, item, store, lockState);
        })
        .then(retryOnThrottled)
        .then(handleErrors);

      return promise;
    }

    function getSetLockStateRequest(token, membershipType, item, store, lockState) {
      return {
        method: 'POST',
        url: 'https://www.bungie.net/Platform/Destiny/SetLockState/',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token,
          'content-type': 'application/json; charset=UTF-8;'
        },
        data: {
          characterId: store.isVault ? item.owner : store.id,
          membershipType: membershipType,
          itemId: item.id,
          state: lockState
        },
        dataType: 'json',
        withCredentials: true
      };
    }
  }
})();
