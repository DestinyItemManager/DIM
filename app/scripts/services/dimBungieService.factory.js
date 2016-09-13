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

    $rootScope.$on('dim-active-platform-updated', function() {
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
      setItemState: setItemState,
      getXur: getXur,
      getManifest: getManifest
    };

    return service;

    function assignResultAndForward(dataset, attribute, result) {
      dataset[attribute] = result;

      return result;
    }

    function handleErrors(response) {
      if (response.status === 503) {
        return $q.reject(new Error("Bungie.net is down."));
      }
      if (response.status < 200 || response.status >= 400) {
        return $q.reject(new Error('Network error: ' + response.status));
      }

      var errorCode = response.data.ErrorCode;
      if (errorCode === 36) {
        return $q.reject(new Error('Bungie API throttling limit exceeded. Please wait a bit and then retry.'));
      } else if (errorCode === 99) {
        openBungieNetTab();
        return $q.reject(new Error('Please log into Bungie.net in order to use this extension.'));
      } else if (errorCode === 5) {
        return $q.reject(new Error('Bungie.net servers are down for maintenance.'));
      } else if (errorCode === 1618 &&
                 response.config.url.indexOf('/Account/') >= 0 &&
                 response.config.url.indexOf('/Character/') < 0) {
        return $q.reject(new Error('No Destiny account was found for this platform.'));
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
            if (response.data) {
              reject(new Error(response.data.Message));
            } else if (response.status === -1) {
              reject(new Error("You may not be connected to the internet."));
            } else {
              console.error("Failed to make service call", response);
              reject(new Error("Failed to make service call."));
            }
          });
        }

        run();
      });

      return a;
    }

    function openBungieNetTab() {
      chrome.tabs.create({
        url: 'https://bungie.net',
        active: true
      });
    }


    /************************************************************************************************************************************/

    function getManifest() {
      return $q.when({
        method: 'GET',
        url: 'https://www.bungie.net/Platform/Destiny/Manifest/',
        headers: {
          'X-API-Key': apiKey
        }
      })
      .then(function(request) {
        return $http(request);
      })
      .then(handleErrors)
      .then(function(response) {
        return response.data.Response;
      });
    }


    /************************************************************************************************************************************/

    function getBnetCookies() {
      return $q(function(resolve, reject) {
        chrome.cookies.getAll({
          domain: 'www.bungie.net'
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

            if (cookie) {
              resolve(cookie.value);
            } else {
              openBungieNetTab();
              reject(new Error('Please log into Bungie.net in order to use this extension.'));
            }
          });
        })
        .catch(function() {
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
          var message = e.message;
          if (e.status === -1) {
            message = 'You may not be connected to the internet.';
          }

          var twitter = '<div>Get status updates on <a target="_blank" href="http://twitter.com/ThisIsDIM">Twitter</a> <a target="_blank" href="http://twitter.com/ThisIsDIM"><i class="fa fa-twitter fa-2x" style="vertical-align: middle;"></i></a></div>';

          toaster.pop({
            type: 'error',
            bodyOutputType: 'trustedHtml',
            title: 'Bungie.net Error',
            body: message + twitter,
            showCloseButton: false
          });

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

    /************************************************************************************************************************************/

    function getMembership(platform) {
      membershipPromise = membershipPromise || getBungleToken()
        .then(getBnetMembershipReqest)
        .then($http)
        .then(handleErrors)
        .then(processBnetMembershipRequest, rejectBnetMembershipRequest)
        .catch(function(error) {
          membershipPromise = null;
          return $q.reject(error);
        });

      return membershipPromise;

      function getBnetMembershipReqest(token) {
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
          return $q.reject(new Error('Failed to find a Destiny account for you on ' + platform.label + '.'));
        }

        return $q.when(response.data.Response);
      }

      function rejectBnetMembershipRequest(response) {
        if (response.status === -1) {
          return $q.reject(new Error('You may not be connected to the internet.'));
        }
        return $q.reject(new Error('Failed to find a Destiny account for you on ' + platform.label + '.'));
      }
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
        .then($http)
        .then(handleErrors)
        .then(processBnetCharactersRequest);

      return charactersPromise;
    }

    function getBnetCharactersRequest(token, platform, membershipId) {
      return {
        method: 'GET',
        url: 'https://www.bungie.net/Platform/Destiny/Tiger' + (platform.type === 1 ? 'Xbox' : 'PSN') + '/Account/' + membershipId + '/',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token
        },
        withCredentials: true
      };
    }

    function processBnetCharactersRequest(response) {
      if (_.size(response.data.Response) === 0) {
        return $q.reject(new Error('The membership id was not available.'));
      }

      return _.map(response.data.Response.data.characters, function(c) {
        c.inventory = response.data.Response.data.inventory;

        return {
          id: c.characterBase.characterId,
          base: c
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

    function getStores(platform, includeVendors, vendorDefs) {
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
          var promises = [
            getDestinyInventories(data.token, platform, data.membershipId, data.characters),
            getDestinyProgression(data.token, platform, data.membershipId, data.characters)
              // Don't let failure of progression fail other requests.
              .catch((e) => console.error("Failed to load character progression", e)),
            getDestinyAdvisors(data.token, platform, data.membershipId, data.characters)
              // Don't let failure of advisors fail other requests.
              .catch((e) => console.error("Failed to load advisors", e))
          ];
          if (includeVendors) {
            promises.push(getDestinyVendors(vendorDefs, data.token, platform, data.membershipId, data.characters));
          }
          return $q.all(promises).then(function(data) {
            return $q.resolve(data[0]);
          });
        })
        .catch(function(e) {
          var twitter = '<div>Get status updates on <a target="_blank" href="http://twitter.com/ThisIsDIM">Twitter</a> <a target="_blank" href="http://twitter.com/ThisIsDIM"><i class="fa fa-twitter fa-2x" style="vertical-align: middle;"></i></a></div>';

          toaster.pop({
            type: 'error',
            bodyOutputType: 'trustedHtml',
            title: 'Bungie.net Error',
            body: e.message + twitter,
            showCloseButton: false
          });

          // toaster.pop('error', 'Bungie.net Error', e.message);

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

    function getGuardianProgressionRequest(token, platform, membershipId, character) {
      return {
        method: 'GET',
        url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/Account/' + membershipId + '/Character/' + character.id + '/Progression/?definitions=false',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token
        },
        withCredentials: true
      };
    }

    function processProgressionResponse(character, response) {
      character.progression = response.data.Response.data;
      return character;
    }

    function getDestinyProgression(token, platform, membershipId, characters) {
      var promises = characters.map(function(character) {
        var processPB = processProgressionResponse.bind(null, character);

        return $q.when(getGuardianProgressionRequest(token, platform, membershipId, character))
          .then($http)
          .then(handleErrors)
          .then(processPB);
      });

      return $q.all(promises);
    }

    /************************************************************************************************************************************/

    function getCharacterAdvisorsRequest(token, platform, membershipId, character) {
      return {
        method: 'GET',
        url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/Account/' + membershipId + '/Character/' + character.id + '/Advisors/V2/?definitions=false',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token
        },
        withCredentials: true
      };
    }

    function processAdvisorsResponse(character, response) {
      character.advisors = response.data.Response.data;
      return character;
    }

    function getDestinyAdvisors(token, platform, membershipId, characters) {
      var promises = characters.map(function(character) {
        var processPB = processAdvisorsResponse.bind(null, character);

        return $q.when(getCharacterAdvisorsRequest(token, platform, membershipId, character))
          .then($http)
          .then(handleErrors)
          .then(processPB);
      });

      return $q.all(promises);
    }

    /************************************************************************************************************************************/

    function getCharacterVendorsRequest(token, platform, membershipId, character, vendorId) {
      return {
        method: 'GET',
        url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/MyAccount/Character/' + character.id + '/Vendor/' + vendorId + '/',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token
        },
        withCredentials: true
      };
    }

    function parseVendorData(vendorData) {
      return vendorData;
    }

    function processVendorsResponse(character, response) {
      if (!character.vendors) {
        character.vendors = {};
      }

      var vendorData = response.data.Response.data;
      character.vendors[vendorData.vendorHash] = parseVendorData(vendorData);
      return character;
    }

    function getDestinyVendors(vendorDefs, token, platform, membershipId, characters) {
      var promises = [];
      _.each(vendorDefs, function(vendorDef, vendorHash) {
        _.each(characters, function(character) {
          var processPB = processVendorsResponse.bind(null, character);
          promises.push(
            $q.when(getCharacterVendorsRequest(token, platform, membershipId, character, vendorHash))
              .then($http)
              .then(handleErrors)
              .then(processPB)
              .catch(function(e) {
                if (e.message !== 'The Vendor you requested was not found.') {
                  throw e;
                }
              })
          );
        });
      });
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
        .then(function(response) {
          return handleUniquenessViolation(response, item, store);
        })
        .then(handleErrors);

      return promise;
    }

    // Handle "DestinyUniquenessViolation" (1648)
    function handleUniquenessViolation(response, item, store) {
      if (response && response.data && response.data.ErrorCode === 1648) {
        toaster.pop('warning', 'Item Uniqueness', [
          "You tried to move the '" + item.name + "'",
          item.type.toLowerCase(),
          "to your",
          store.name,
          "but that destination already has that item and is only allowed one."
        ].join(' '));
        return $q.reject(new Error('move-canceled'));
      }
      return response;
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
      // Sort exotics to the end. See https://github.com/DestinyItemManager/DIM/issues/323
      items = _.sortBy(items, function(i) {
        return i.isExotic ? 1 : 0;
      });

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
          store.updateCharacterInfoFromEquip(data.summary);
          return _.select(items, function(i) {
            var item = _.find(data.equipResults, { itemInstanceId: i.id });
            return item && item.equipStatus === 1;
          });
        });

      return promise;
    }

    /************************************************************************************************************************************/

    function setItemState(item, store, lockState, type) {
      switch (type) {
      case 'lock': type = 'SetLockState'; break;
      case 'track': type = 'SetQuestTrackedState'; break;
      }

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
          return getSetItemStateRequest(data.token, platform.type, item, store, lockState, type);
        })
        .then(retryOnThrottled)
        .then(handleErrors);

      return promise;
    }

    function getSetItemStateRequest(token, membershipType, item, store, lockState, type) {
      return {
        method: 'POST',
        url: 'https://www.bungie.net/Platform/Destiny/' + type + '/',
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
