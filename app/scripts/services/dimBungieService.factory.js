(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimBungieService', BungieService);

  BungieService.$inject = ['$rootScope', '$q', '$timeout', '$http', '$state', 'dimState', 'toaster', '$translate'];

  function BungieService($rootScope, $q, $timeout, $http, $state, dimState, toaster, $translate) {
    localStorage.apiKey = 'a16976e9c1ec49c0b7673c10ce357393';
    var apiKey = localStorage.apiKey;
    /* eslint no-constant-condition: 0*/
    if ('$DIM_FLAVOR' === 'release' || '$DIM_FLAVOR' === 'beta') {
      apiKey = '$DIM_API_KEY';
    }

    var platformPromise = null;
    var membershipPromise = null;

    $rootScope.$on('dim-active-platform-updated', function() {
      platformPromise = null;
      membershipPromise = null;
    });

    // $rootScope.$on('dim-no-token-found', function() {
    //   window.location = "/login.html";
    //   // debugger;
    // });


    // function getRefreshToken() {
    //   var authorization = null;

    //   if (localStorage.authorization) {
    //     try {
    //       authorization = JSON.parse(localStorage.authorization);
    //     } catch (e) {
    //       authorization = null;
    //     }
    //   }

    //   return $http({
    //     method: 'POST',
    //     url: 'https://www.bungie.net/Platform/App/GetAccessTokensFromRefreshToken/',
    //     headers: {
    //       'X-API-Key': localStorage.apiKey,
    //     },
    //     data: {
    //       refreshToken: authorization.refreshToken.value
    //     }
    //   })
    //   .then((response) => {
    //     if (response.data.Response && response.data.Response.accessToken) {
    //       authorization = {
    //         accessToken: response.data.Response.accessToken,
    //         refreshToken: response.data.Response.refreshToken,
    //         inception: new Date(),
    //         scope: response.data.Response.scope
    //       };

    //       authorization.accessToken.name = 'access';
    //       authorization.refreshToken = response.data.Response.refreshToken;
    //       authorization.refreshToken.name = 'refresh';
    //       authorization.refreshToken.inception = authorization.accessToken.inception = new Date();

    //       localStorage.authorization = JSON.stringify(authorization);
    //     }
    //   });
    // }

    var service = {
      getPlatforms: getPlatforms,
      getCharacters: getCharacters,
      getStores: getStores,
      transfer: transfer,
      equip: equip,
      equipItems: equipItems,
      setItemState: setItemState,
      getXur: getXur,
      getManifest: getManifest,
      getVendorForCharacter: getVendorForCharacter
    };

    return service;

    function assignResultAndForward(dataset, attribute, result) {
      dataset[attribute] = result;

      return result;
    }

    function handleErrors(response) {
      // return response;
      if (response.status === -1) {
        return $q.reject(new Error($translate.instant('BungieService.NotConnected')));
      }
      if (response.status === 503 || response.status === 522 /* cloudflare */) {
        return $q.reject(new Error($translate.instant('BungieService.Down')));
      }
      if (response.status < 200 || response.status >= 400) {
        return $q.reject(new Error($translate.instant('BungieService.NetworkError', {
          status: response.status,
          statusText: response.statusText
        })));
      }

      var errorCode = response.data.ErrorCode;
      if (errorCode === 36) {
        return $q.reject(new Error($translate.instant('BungieService.Throttled')));
      } else if (errorCode === 99) {
        return $q.reject(new Error($translate.instant('BungieService.NotLoggedIn')));
      } else if (errorCode === 5) {
        return $q.reject(new Error($translate.instant('BungieService.Maintenance')));
      } else if (errorCode === 1618 &&
        response.config.url.indexOf('/Account/') >= 0 &&
        response.config.url.indexOf('/Character/') < 0) {
        return $q.reject(new Error($translate.instant('BungieService.NoAccount')));
      } else if (errorCode === 2107 || errorCode === 2101 || errorCode === 2102) {
        $state.go('developer');
        return $q.reject(new Error('Are you running a development version of DIM? You must register your chrome extension with bungie.net.'));
      } else if (errorCode > 1) {
        if (response.data.Message) {
          const error = new Error(response.data.Message);
          error.code = response.data.ErrorCode;
          error.status = response.data.ErrorStatus;
          return $q.reject(error);
        } else {
          return $q.reject(new Error($translate.instant('BungieService.Difficulties')));
        }
      }

      return response;
    }

    function retryOnThrottled(request) {
      function run(retries) {
        return $http(request)
          .then(function success(response) {
            if (response.data.ErrorCode === 36) {
              if (retries <= 0) {
                return response;
              } else {
                return $timeout(Math.pow(2, 4 - retries) * 1000).then(() => run(retries - 1));
              }
            } else {
              return response;
            }
          })
          .catch(handleErrors);
      }

      return run(3);
    }

    function showErrorToaster(e) {
      const twitterLink = '<a target="_blank" href="http://twitter.com/ThisIsDIM">Twitter</a> <a target="_blank" href="http://twitter.com/ThisIsDIM"><i class="fa fa-twitter fa-2x" style="vertical-align: middle;"></i></a>';
      const twitter = `<div> ${$translate.instant('BungieService.Twitter')} ${twitterLink}</div>`;

      toaster.pop({
        type: 'error',
        bodyOutputType: 'trustedHtml',
        title: 'Bungie.net Error',
        body: e.message + twitter,
        showCloseButton: false
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
      .then($http)
      .then(handleErrors, handleErrors)
      .then(function(response) {
        return response.data.Response;
      });
    }

    /************************************************************************************************************************************/

    function getPlatforms() {
      platformPromise = platformPromise || $q.when(getBnetPlatformsRequest())
        .then($http)
        .then(handleErrors, handleErrors)
        .catch(function(e) {
          showErrorToaster(e);
          return $q.reject(e);
        });

      return platformPromise;

      function getBnetPlatformsRequest() {
        return {
          method: 'GET',
          url: 'https://www.bungie.net/Platform/User/GetBungieNetUser/',
          headers: {
            'X-API-Key': apiKey
          },
          withCredentials: true
        };
      }
    }

    /************************************************************************************************************************************/

    function getMembership(platform) {
      membershipPromise = membershipPromise || $q.when(getBnetMembershipReqest())
        .then($http)
        .then(handleErrors, handleErrors)
        .then(processBnetMembershipRequest, rejectBnetMembershipRequest)
        .catch(function(error) {
          membershipPromise = null;
          return $q.reject(error);
        });

      return membershipPromise;

      function getBnetMembershipReqest() {
        return {
          method: 'GET',
          url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/Stats/GetMembershipIdByDisplayName/' + platform.id + '/',
          headers: {
            'X-API-Key': apiKey
          },
          withCredentials: true
        };
      }

      function processBnetMembershipRequest(response) {
        if (_.size(response.data.Response) === 0) {
          return $q.reject(new Error($translate.instant('BungieService.NoAccountForPlatform', {
            platform: platform.label
          })));
        }

        return $q.when(response.data.Response);
      }

      function rejectBnetMembershipRequest() {
        return $q.reject(new Error($translate.instant('BungieService.NoAccountForPlatform', {
          platform: platform.label
        })));
      }
    }


    /************************************************************************************************************************************/

    function getCharacters(platform) {
      var getMembershipPB = getMembership.bind(null, platform);

      var charactersPromise = getMembershipPB()
        .then(function(membershipId) {
          return getBnetCharactersRequest('', platform, membershipId);
        })
        .then($http)
        .then(handleErrors, handleErrors)
        .then(processBnetCharactersRequest);

      return charactersPromise;

      function getBnetCharactersRequest(token, platform, membershipId) {
        return {
          method: 'GET',
          url: 'https://www.bungie.net/Platform/Destiny/Tiger' + (platform.type === 1 ? 'Xbox' : 'PSN') + '/Account/' + membershipId + '/',
          headers: {
            'X-API-Key': apiKey
          },
          withCredentials: true
        };
      }

      function processBnetCharactersRequest(response) {
        if (_.size(response.data.Response) === 0) {
          return $q.reject(new Error($translate.instant('BungieService.NoAccountForPlatform', {
            platform: platform.label
          })));
        }

        return _.map(response.data.Response.data.characters, function(c) {
          c.inventory = response.data.Response.data.inventory;

          return {
            id: c.characterBase.characterId,
            base: c
          };
        });
      }
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
      .then(handleErrors, handleErrors)
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

      var addMembershipIdToData = assignResultAndForward.bind(null, data, 'membershipId');
      var addCharactersToData = assignResultAndForward.bind(null, data, 'characters');
      var getMembershipPB = getMembership.bind(null, platform);
      var getCharactersPB = getCharacters.bind(null, platform);

      var promise = getMembershipPB()
        .then(addMembershipIdToData)
        .then(getCharactersPB)
        .then(addCharactersToData)
        .then(function() {
          var promises = [
            getDestinyInventories('', platform, data.membershipId, data.characters),
            getDestinyProgression('', platform, data.membershipId, data.characters)
            // Don't let failure of progression fail other requests.
            .catch((e) => console.error("Failed to load character progression", e)),
            getDestinyAdvisors('', platform, data.membershipId, data.characters)
            // Don't let failure of advisors fail other requests.
            .catch((e) => console.error("Failed to load advisors", e))
          ];
          return $q.all(promises).then(function(data) {
            return $q.resolve(data[0]);
          });
        })
        .catch(function(e) {
          showErrorToaster(e);
          return $q.reject(e);
        });

      return promise;

      function getGuardianInventoryRequest(token, platform, membershipId, character) {
        return {
          method: 'GET',
          url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/Account/' + membershipId + '/Character/' + character.id + '/Inventory/?definitions=false',
          headers: {
            'X-API-Key': apiKey
          },
          withCredentials: true
        };
      }

      function getDestinyVaultRequest(token, platform) {
        return {
          method: 'GET',
          url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/MyAccount/Vault/?definitions=false',
          headers: {
            'X-API-Key': apiKey
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
            .then(handleErrors, handleErrors)
            .then(processPB);
        });

        // Vault

        var processPB = processInventoryResponse.bind(null, {
          id: 'vault',
          base: null
        });

        var promise = $q.when(getDestinyVaultRequest(token, platform))
          .then($http)
          .then(handleErrors, handleErrors)
          .then(processPB);

        promises.push(promise);

        return $q.all(promises);
      }
    }


    /************************************************************************************************************************************/

    function getDestinyProgression(token, platform, membershipId, characters) {
      var promises = characters.map(function(character) {
        var processPB = processProgressionResponse.bind(null, character);

        return $q.when(getGuardianProgressionRequest(token, platform, membershipId, character))
          .then($http)
          .then(handleErrors, handleErrors)
          .then(processPB);
      });

      function getGuardianProgressionRequest(token, platform, membershipId, character) {
        return {
          method: 'GET',
          url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/Account/' + membershipId + '/Character/' + character.id + '/Progression/?definitions=false',
          headers: {
            'X-API-Key': apiKey
          },
          withCredentials: true
        };
      }

      function processProgressionResponse(character, response) {
        character.progression = response.data.Response.data;
        return character;
      }

      return $q.all(promises);
    }

    /************************************************************************************************************************************/

    function getDestinyAdvisors(token, platform, membershipId, characters) {
      var promises = characters.map(function(character) {
        var processPB = processAdvisorsResponse.bind(null, character);

        return $q.when(getCharacterAdvisorsRequest(token, platform, membershipId, character))
          .then($http)
          .then(handleErrors, handleErrors)
          .then(processPB);
      });

      return $q.all(promises);

      function getCharacterAdvisorsRequest(token, platform, membershipId, character) {
        return {
          method: 'GET',
          url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/Account/' + membershipId + '/Character/' + character.id + '/Advisors/V2/?definitions=false',
          headers: {
            'X-API-Key': apiKey
          },
          withCredentials: true
        };
      }

      function processAdvisorsResponse(character, response) {
        character.advisors = response.data.Response.data;
        return character;
      }
    }

    /************************************************************************************************************************************/

    function getVendorForCharacter(character, vendorHash) {
      var platform = dimState.active;

      var getMembershipPB = getMembership.bind(null, platform);

      return getMembershipPB()
        .then(() => {
          return {
            method: 'GET',
            url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/MyAccount/Character/' + character.id + '/Vendor/' + vendorHash + '/',
            headers: {
              'X-API-Key': apiKey
            },
            withCredentials: true
          };
        })
        .then($http)
        .then(handleErrors, handleErrors)
        .then((response) => response.data.Response.data);
    }

    /************************************************************************************************************************************/

    function transfer(item, store, amount) {
      var platform = dimState.active;
      var data = {
        token: null,
        membershipType: null
      };

      var addMembershipTypeToDataPB = assignResultAndForward.bind(null, data, 'membershipType');
      var getMembershipPB = getMembership.bind(null, platform);

      var promise = getMembershipPB()
        .then(addMembershipTypeToDataPB)
        .then(function() {
          return getTransferRequest(data.token, platform.type, item, store, amount);
        })
        .then(retryOnThrottled)
        .then(handleErrors, handleErrors)
        .catch(function(e) {
          return handleUniquenessViolation(e, item, store);
        });

      return promise;

      // Handle "DestinyUniquenessViolation" (1648)
      function handleUniquenessViolation(e, item, store) {
        if (e && e.code === 1648) {
          toaster.pop('warning',
            $translate.instant('BungieService.ItemUniqueness'),
            $translate.instant('BungieService.ItemUniquenessExplanation', {
              name: item.name,
              type: item.type.toLowerCase(),
              character: store.name
            }));
          return $q.reject(new Error('move-canceled'));
        }
        return $q.reject(e);
      }

      function getTransferRequest(token, membershipType, item, store, amount) {
        return {
          method: 'POST',
          url: 'https://www.bungie.net/Platform/Destiny/TransferItem/',
          headers: {
            'X-API-Key': apiKey
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
    }

    /************************************************************************************************************************************/

    function equip(item) {
      var platform = dimState.active;
      var data = {
        token: null,
        membershipType: null
      };

      var addMembershipTypeToDataPB = assignResultAndForward.bind(null, data, 'membershipType');
      var getMembershipPB = getMembership.bind(null, platform);

      var promise = getMembershipPB()
        .then(addMembershipTypeToDataPB)
        .then(function() {
          return getEquipRequest(data.token, platform.type, item);
        })
        .then(retryOnThrottled)
        .then(handleErrors, handleErrors);

      return promise;

      function getEquipRequest(token, membershipType, item) {
        return {
          method: 'POST',
          url: 'https://www.bungie.net/Platform/Destiny/EquipItem/',
          headers: {
            'X-API-Key': apiKey
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

      var addMembershipTypeToDataPB = assignResultAndForward.bind(null, data, 'membershipType');
      var getMembershipPB = getMembership.bind(null, platform);

      var promise = getMembershipPB()
        .then(addMembershipTypeToDataPB)
        .then(function() {
          return {
            method: 'POST',
            url: 'https://www.bungie.net/Platform/Destiny/EquipItems/',
            headers: {
              'X-API-Key': apiKey
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
        .then(handleErrors, handleErrors)
        .then(function(response) {
          var data = response.data.Response;
          store.updateCharacterInfoFromEquip(data.summary);
          return _.select(items, function(i) {
            var item = _.find(data.equipResults, {
              itemInstanceId: i.id
            });
            return item && item.equipStatus === 1;
          });
        });

      return promise;
    }

    /************************************************************************************************************************************/

    function setItemState(item, store, lockState, type) {
      switch (type) {
      case 'lock':
        type = 'SetLockState';
        break;
      case 'track':
        type = 'SetQuestTrackedState';
        break;
      }

      var platform = dimState.active;
      var data = {
        token: null,
        membershipType: null
      };

      var addMembershipTypeToDataPB = assignResultAndForward.bind(null, data, 'membershipType');
      var getMembershipPB = getMembership.bind(null, platform);

      var promise = getMembershipPB()
        .then(addMembershipTypeToDataPB)
        .then(function() {
          return store;
        })
        .then(function(store) {
          return getSetItemStateRequest(data.token, platform.type, item, store, lockState, type);
        })
        .then(retryOnThrottled)
        .then(handleErrors, handleErrors);

      return promise;

      function getSetItemStateRequest(token, membershipType, item, store, lockState, type) {
        return {
          method: 'POST',
          url: 'https://www.bungie.net/Platform/Destiny/' + type + '/',
          headers: {
            'X-API-Key': apiKey
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
  }
})();
