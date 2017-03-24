import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .factory('dimBungieService', BungieService);

function BungieService($rootScope, $q, $timeout, $http, $state, dimState, toaster, $translate) {
  var apiKey;
  if ($DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta') {
    if (window.chrome && window.chrome.extension) {
      apiKey = $DIM_API_KEY;
    } else {
      apiKey = $DIM_WEB_API_KEY;
    }
  } else {
    apiKey = localStorage.apiKey;
  }

  var tokenPromise = null;
  var platformPromise = null;
  var membershipPromise = null;

  $rootScope.$on('dim-active-platform-updated', function() {
    tokenPromise = null;
    platformPromise = null;
    membershipPromise = null;
  });

  // Don't open bungie tab more than once a minute
  const openBungieNetTab = _.debounce(() => {
    chrome.tabs.create({
      url: 'https://www.bungie.net',
      active: true
    });
  }, 60 * 1000, true);

  var service = {
    getPlatforms: getPlatforms,
    getCharacters: getCharacters,
    getStores: getStores,
    transfer: transfer,
    equip: equip,
    equipItems: equipItems,
    setItemState: setItemState,
    getManifest: getManifest,
    getVendorForCharacter: getVendorForCharacter
  };

  return service;

  function assignResultAndForward(dataset, attribute, result) {
    dataset[attribute] = result;

    return result;
  }

  function handleErrors(response) {
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

    var errorCode = response.data ? response.data.ErrorCode : -1;

    // See https://github.com/DestinyDevs/BungieNetPlatform/wiki/Enums#platformerrorcodes
    switch (errorCode) {
    case 1: // Success
      return response;
    case 1627: // DestinyVendorNotFound
      return $q.reject(new Error($translate.instant('BungieService.VendorNotFound')));
    case 2106: // AuthorizationCodeInvalid
    case 2108: // AccessNotPermittedByApplicationScope
      $rootScope.$broadcast('dim-no-token-found');
      return $q.reject("DIM does not have permission to perform this action.");
    case 5: // SystemDisabled
      return $q.reject(new Error($translate.instant('BungieService.Maintenance')));
    case 35: // ThrottleLimitExceededMinutes
    case 36: // ThrottleLimitExceededMomentarily
    case 37: // ThrottleLimitExceededSeconds
      return $q.reject(new Error($translate.instant('BungieService.Throttled')));
    case 2111: // token expired
    case 99: // WebAuthRequired
      if (window.chrome && window.chrome.extension) {
        openBungieNetTab();
      } else {
        $rootScope.$broadcast('dim-no-token-found');
      }
      return $q.reject(new Error($translate.instant('BungieService.NotLoggedIn')));
    case 1601: // DestinyAccountNotFound
    case 1618: // DestinyUnexpectedError
      if (response.config.url.indexOf('/Account/') >= 0 &&
          response.config.url.indexOf('/Character/') < 0) {
        return $q.reject(new Error($translate.instant('BungieService.NoAccount', { platform: dimState.active.label })));
      }
    case 2101: // ApiInvalidOrExpiredKey
    case 2102: // ApiKeyMissingFromRequest
    case 2107: // OriginHeaderDoesNotMatchKey
      $state.go('developer');
      return $q.reject(new Error($translate.instant('BungieService.DevVersion')));
    }

    // Any other error
    if (errorCode > 1) {
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

  function getBnetCookies() {
    return $q(function(resolve, reject) {
      chrome.cookies.getAll({
        domain: 'www.bungie.net'
      }, getAllCallback);

      function getAllCallback(cookies) {
        if (_.size(cookies) > 0) {
          resolve(cookies);
        } else {
          reject(new Error($translate.instant('BungieService.NoCookies')));
        }
      }
    });
  }

  /************************************************************************************************************************************/

  function getBungleToken() {
    if (!window.chrome || !chrome.extension) {
      return $q.resolve();
    }
    tokenPromise = tokenPromise || getBnetCookies()
      .then(function(cookies) {
        const cookie = _.find(cookies, function(cookie) {
          return cookie.name === 'bungled';
        });

        if (cookie) {
          return cookie.value;
        } else {
          openBungieNetTab();
          throw new Error($translate.instant('BungieService.NotLoggedIn'));
        }
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
      .then(handleErrors, handleErrors)
      .catch(function(e) {
        showErrorToaster(e);
        return $q.reject(e);
      });

    return platformPromise;

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
  }

  /************************************************************************************************************************************/

  function getMembership(platform) {
    membershipPromise = membershipPromise || getBungleToken()
      .then(getBnetMembershipReqest)
      .then($http)
      .then(handleErrors, handleErrors)
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
      .then(handleErrors, handleErrors)
      .then(processBnetCharactersRequest);

    return charactersPromise;

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
        var promises = [
          getDestinyInventories(data.token, platform, data.membershipId, data.characters),
          getDestinyProgression(data.token, platform, data.membershipId, data.characters)
          // Don't let failure of progression fail other requests.
          .catch((e) => console.error("Failed to load character progression", e)),
          getDestinyAdvisors(data.token, platform, data.membershipId, data.characters)
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
  }

  /************************************************************************************************************************************/

  function getVendorForCharacter(character, vendorHash) {
    var platform = dimState.active;
    var data = {
      token: null,
      membershipType: null
    };
    var addTokenToDataPB = assignResultAndForward.bind(null, data, 'token');
    var getMembershipPB = getMembership.bind(null, platform);
    return getBungleToken()
      .then(addTokenToDataPB)
      .then(getMembershipPB)
      .then(() => {
        return {
          method: 'GET',
          url: 'https://www.bungie.net/Platform/Destiny/' + platform.type + '/MyAccount/Character/' + character.id + '/Vendor/' + vendorHash + '/',
          headers: {
            'X-API-Key': apiKey,
            'x-csrf': data.token
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

    var addTokenToDataPB = assignResultAndForward.bind(null, data, 'token');
    var addMembershipTypeToDataPB = assignResultAndForward.bind(null, data, 'membershipType');
    var getMembershipPB = getMembership.bind(null, platform);

    var promise = getBungleToken()
      .then(addTokenToDataPB)
      .then(getMembershipPB)
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
        const error = Error($translate.instant('BungieService.ItemUniquenessExplanation', {
          name: item.name,
          type: item.type.toLowerCase(),
          character: store.name,
          gender: store.gender
        }));
        error.code = e.code;
        return $q.reject(error);
      }
      return $q.reject(e);
    }

    function getTransferRequest(token, membershipType, item, store, amount) {
      return {
        method: 'POST',
        url: 'https://www.bungie.net/Platform/Destiny/TransferItem/',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token
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
      .then(handleErrors, handleErrors);

    return promise;

    function getEquipRequest(token, membershipType, item) {
      return {
        method: 'POST',
        url: 'https://www.bungie.net/Platform/Destiny/EquipItem/',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token
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
            'x-csrf': data.token
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
      .then(handleErrors, handleErrors);

    return promise;

    function getSetItemStateRequest(token, membershipType, item, store, lockState, type) {
      return {
        method: 'POST',
        url: 'https://www.bungie.net/Platform/Destiny/' + type + '/',
        headers: {
          'X-API-Key': apiKey,
          'x-csrf': token
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

