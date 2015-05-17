(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimBungieService', BungieService);

  BungieService.$inject = ['$rootScope', '$q', '$timeout', '$http', 'dimState', 'rateLimiterQueue', 'toaster'];

  function BungieService($rootScope, $q, $timeout, $http, dimState, rateLimiterQueue, toaster) {
    var apiKey = '57c5ff5864634503a0340ffdfbeb20c0';
    var tokenPromise = null;
    var platformPromise = null;
    var membershipPromise = null;
    var charactersPromise = null;

    //var transferRateLimit = dimRateLimit.rateLimit(transfer, 3000);

    $rootScope.$on('dim-active-platform-updated', function(event, args) {
      tokenPromise = null;
      platformPromise = null;
      membershipPromise = null;
      charactersPromise = null;
    });

    var service = {
      getPlatforms: getPlatforms,
      getStores: getStores,
      transfer: transfer,
      equip: equip
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
        return $q.reject(new Error('Network error: ' + response.status));
      }
    }

    function throttleCheck(response) {
      return $q(function(resolve, reject) {
        if (response.data.ErrorCode !== 36) {
          return resolve(response);
        } else {
          return reject({
            errorCode: 36,
            message: 'Throttle limit exceeded.  Retry.'
          });
        }
      });
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
              chrome.tabs.query({
                'url': '*://*.bungie.net/*'
              }, function(tabs) {
                if (_.size(tabs) === 0) {
                  chrome.tabs.create({
                    url: 'http://bungie.net',
                    active: false
                  });
                }
              });

              reject(new Error('No bungled cookie found.'));
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
        .then(networkError)
        .then(throttleCheck)
        .then(processBnetPlatformsRequest)
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

    function processBnetPlatformsRequest(response) {
      if (response.data.ErrorCode === 99) {
        chrome.tabs.query({
          'url': '*://*.bungie.net/*'
        }, function(tabs) {
          if (_.size(tabs) === 0) {
            chrome.tabs.create({
              url: 'http://bungie.net',
              active: false
            });
          }
        });

        return $q.reject(new Error('Please log into Bungie.net before using this extension.'));
      } else if (response.data.ErrorCode === 5) {
        return $q.reject(new Error('Bungie.net servers are down for maintenance.'));
      } else if (response.data.ErrorCode > 1) {
        return $q.reject(new Error(response.data.Message));
      }

      return (response);
    }

    function rejectBnetPlatformsRequest(error) {
      return $q.reject(new Error('Message missing.'));
    }

    /************************************************************************************************************************************/

    function getMembership(platform) {
      membershipPromise = membershipPromise || getBungleToken()
        .then(getBnetMembershipReqest.bind(null, platform))
        .then($http)
        .then(networkError)
        .then(throttleCheck)
        .then(processBnetMembershipRequest, rejectBnetMembershipRequest)
        .catch(function(error) {
          membershipPromise = null;
        });

      return membershipPromise;
    }

    function getBnetMembershipReqest(platform, token) {
      return $q.when((function() {
        return {
          method: 'GET',
          url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/Stats/GetMembershipIdByDisplayName/' + platform.id + '/',
          headers: {
            'X-API-Key': apiKey,
            'x-csrf': token
          },
          withCredentials: true
        };
      })());
    }

    function processBnetMembershipRequest(response) {
      if (_.size(response.data.Response) === '0') {
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
      var addMembershipIdToData = assignResultAndForward.bind(null, data, 'membershipId');
      var getMembershipPB = getMembership.bind(null, platform);

      charactersPromise = charactersPromise || getBungleToken()
        .then(addTokenToData)
        .then(getMembershipPB)
        .then(function(membershipId) {
          return getBnetCharactersRequest(data.token, platform, membershipId);
        })
        .then($http)
        .then(networkError)
        .then(throttleCheck)
        .then(processBnetCharactersRequest, rejectBnetCharactersRequest);

      return charactersPromise;
    }

    function getBnetCharactersRequest(token, platform, membershipId) {
      return $q.when((function() {
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
      if (response.data.ErrorCode === 5) {
        return $q.reject(new Error('Bungie.net is down for maintenance.'));
      } else if (_.size(response.data.Response) === 0) {
        return $q.reject(new Error('The membership id was not available.'));
      }

      return $q.when((function() {
        return _.map(response.data.Response.data.characters, function(character) {
          return {
            'id': character.characterBase.characterId,
            'base': character
          };
        });
      })());
    }

    function rejectBnetCharactersRequest(response) {
      $q.reject(new Error('The characters request failed.'));
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

      return $q.when(payload);
    }

    function rejectInventoryResponse(error) {
      $q.reject(new Error('The store inventory was not available.'));
    }

    function getDestinyInventories(token, platform, membershipId, characters) {
      var promises = [];
      var promise;
      var processPB;

      // Guardians
      _.each(characters, function(character) {
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

    /************************************************************************************************************************************/

    function transfer(item, store) {
      var platform = dimState.active;
      var membershipType = platform.type;
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
          return getTransferRequest(data.token, platform.type, item, store);
        })
        .then(function(request) {
          return $q(function(resolve, reject) {
            var retries = 4;

            function run() {
              $http(request).then(function success(response) {
                if (response.data.ErrorCode === 36) {
                  retries = retries - 1;

                  if (retries <= 0) {
                    // debugger;
                    reject(new Error(response.data.Message));
                  } else {
                    $timeout(run, Math.pow(2, 4 - retries) * 1000);
                  }
                } else if (response.data.ErrorCode > 1) {
                  reject(new Error(response.data.Message));
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
        })
        .then(networkError)
        .then(throttleCheck)
        .then(function(response) {
          var a = response.status;
        });

      return promise;
    }

    function getTransferRequest(token, membershipType, item, store) {
      return {
        method: 'POST',
        url: 'https://www.bungie.net/Platform/Destiny/TransferItem/',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token,
          'content-type': 'application/json; charset=UTF-8;'
        },
        data: {
          characterId: (store.id === 'vault') ? item.owner : store.id,
          membershipType: membershipType,
          itemId: item.id,
          itemReferenceHash: item.hash,
          stackSize: (_.has(item, 'moveAmount') && item.moveAmount > 0) ? item.moveAmount : item.amount,
          transferToVault: (store.id === 'vault')
        },
        dataType: 'json',
        withCredentials: true
      };
    }

    /************************************************************************************************************************************/

    function equip(item) {
      var platform = dimState.active;
      var membershipType = platform.type;
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
        .then(function(request) {
          var a = $q(function(resolve, reject) {
            var retries = 4;

            function run() {
              $http(request).then(function success(response) {
                if (response.data.ErrorCode === 36) {
                  retries = retries - 1;

                  if (retries <= 0) {
                    // debugger;
                    reject(new Error(response.data.Message));
                  } else {
                    $timeout(run, Math.pow(2, 4 - retries) * 1000);
                  }
                } else if (response.data.ErrorCode > 1) {
                  reject(new Error(response.data.Message));
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
        })
        .then(networkError)
        .then(throttleCheck)
        .then(function(response) {
          var a = response.status;
        });

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
  }
})();
