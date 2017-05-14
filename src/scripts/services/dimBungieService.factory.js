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

  var platformPromise = null;
  var membershipPromise = null;

  $rootScope.$on('dim-active-platform-updated', function() {
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
    getManifest: getManifest,
    getVendorForCharacter: getVendorForCharacter
  };

  return service;

  function bungieApiUpdate(path, data) {
    return {
      method: 'POST',
      url: 'https://www.bungie.net' + path,
      headers: {
        'X-API-Key': apiKey
      },
      withCredentials: true,
      dataType: 'json',
      data: data
    };
  }

  function bungieApiQuery(path) {
    return {
      method: 'GET',
      url: 'https://www.bungie.net' + path,
      headers: {
        'X-API-Key': apiKey
      },
      withCredentials: true
    };
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
      $rootScope.$broadcast('dim-no-token-found');
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
      if ($DIM_FLAVOR === 'dev') {
        $state.go('developer');
        return $q.reject(new Error($translate.instant('BungieService.DevVersion')));
      } else {
        return $q.reject(new Error($translate.instant('BungieService.Difficulties')));
      }
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

  function getManifest() {
    return $http(bungieApiQuery('/Platform/Destiny/Manifest/'))
      .then(handleErrors, handleErrors)
      .then((response) => response.data.Response);
  }

  function getPlatforms() {
    platformPromise = platformPromise ||
      $http(bungieApiQuery('/Platform/User/GetBungieNetUser/'))
      .then(handleErrors, handleErrors)
      .catch(function(e) {
        showErrorToaster(e);
        return $q.reject(e);
      });

    return platformPromise;
  }

  function getMembership(platform) {
    membershipPromise = membershipPromise ||
      $http(bungieApiQuery(
        `/Platform/Destiny/${platform.type}/Stats/GetMembershipIdByDisplayName/${platform.id}/`
      ))
      .then(handleErrors, handleErrors)
      .then(processBnetMembershipRequest, rejectBnetMembershipRequest)
      .catch(function(error) {
        membershipPromise = null;
        return $q.reject(error);
      });

    return membershipPromise;

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

  function getCharacters(platform) {
    const platformName = platform.type === 1 ? 'Xbox' : 'PSN';

    var charactersPromise = getMembership(platform)
        .then((membershipId) => $http(bungieApiQuery(
          `/Platform/Destiny/Tiger${platformName}/Account/${membershipId}/`
        )))
        .then(handleErrors, handleErrors)
        .then(processBnetCharactersRequest);

    return charactersPromise;

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

  function getStores(platform) {
    return $q.all([
      getMembership(platform),
      getCharacters(platform)
    ])
      .then(function([membershipId, characters]) {
        return $q.all([
          getDestinyInventories(platform, membershipId, characters),
          getDestinyProgression(platform, membershipId, characters)
          // Don't let failure of progression fail other requests.
            .catch((e) => console.error("Failed to load character progression", e)),
          getDestinyAdvisors(platform, membershipId, characters)
          // Don't let failure of advisors fail other requests.
            .catch((e) => console.error("Failed to load advisors", e))
        ]).then(function(data) {
          return data[0];
        });
      })
      .catch(function(e) {
        showErrorToaster(e);
        return $q.reject(e);
      });

    function processInventoryResponse(character, response) {
      var payload = response.data.Response;

      payload.id = character.id;
      payload.character = character;

      return payload;
    }

    function getDestinyInventories(platform, membershipId, characters) {
      // Guardians
      const promises = characters.map(function(character) {
        return $http(bungieApiQuery(
          `/Platform/Destiny/${platform.type}/Account/${membershipId}/Character/${character.id}/Inventory/?definitions=false`
        ))
          .then(handleErrors, handleErrors)
          .then((response) => processInventoryResponse(character, response));
      });

      // Vault
      const vault = {
        id: 'vault',
        base: null
      };

      const vaultPromise = $http(bungieApiQuery(`/Platform/Destiny/${platform.type}/MyAccount/Vault/?definitions=false`))
        .then(handleErrors, handleErrors)
          .then((response) => processInventoryResponse(vault, response));

      promises.push(vaultPromise);

      return $q.all(promises);
    }
  }

  function getDestinyProgression(platform, membershipId, characters) {
    const promises = characters.map(function(character) {
      return $http(bungieApiQuery(
        `/Platform/Destiny/${platform.type}/Account/${membershipId}/Character/${character.id}/Progression/?definitions=false`
      ))
        .then(handleErrors, handleErrors)
        .then((response) => processProgressionResponse(character, response));
    });

    function processProgressionResponse(character, response) {
      character.progression = response.data.Response.data;
      return character;
    }

    return $q.all(promises);
  }

  function getDestinyAdvisors(platform, membershipId, characters) {
    var promises = characters.map(function(character) {
      return $http(bungieApiQuery(
        `/Platform/Destiny/${platform.type}/Account/${membershipId}/Character/${character.id}/Advisors/V2/?definitions=false`
      ))
        .then(handleErrors, handleErrors)
        .then((response) => processAdvisorsResponse(character, response));
    });

    return $q.all(promises);

    function processAdvisorsResponse(character, response) {
      character.advisors = response.data.Response.data;
      return character;
    }
  }

  function getVendorForCharacter(character, vendorHash) {
    var platform = dimState.active;
    return $http(bungieApiQuery(
      `/Platform/Destiny/${platform.type}/MyAccount/Character/${character.id}/Vendor/${vendorHash}/`
    ))
      .then(handleErrors, handleErrors)
      .then((response) => response.data.Response.data);
  }

  function transfer(item, store, amount) {
    var platform = dimState.active;
    var promise = $http(bungieApiUpdate(
      '/Platform/Destiny/TransferItem/',
      {
        characterId: store.isVault ? item.owner : store.id,
        membershipType: platform.type,
        itemId: item.id,
        itemReferenceHash: item.hash,
        stackSize: amount || item.amount,
        transferToVault: store.isVault
      }
    ))
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
  }

  function equip(item) {
    var platform = dimState.active;
    return $http(bungieApiUpdate(
      '/Platform/Destiny/EquipItem/',
      {
        characterId: item.owner,
        membershipType: platform.type,
        itemId: item.id
      }
    ))
      .then(retryOnThrottled)
      .then(handleErrors, handleErrors);
  }

  // Returns a list of items that were successfully equipped
  function equipItems(store, items) {
    // Sort exotics to the end. See https://github.com/DestinyItemManager/DIM/issues/323
    items = _.sortBy(items, function(i) {
      return i.isExotic ? 1 : 0;
    });

    var platform = dimState.active;
    return $http(bungieApiUpdate(
      '/Platform/Destiny/EquipItems/',
      {
        characterId: store.id,
        membershipType: platform.type,
        itemIds: _.pluck(items, 'id')
      }))
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
  }

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
    return $http(bungieApiUpdate(
      `/Platform/Destiny/${type}/`,
      {
        characterId: store.isVault ? item.owner : store.id,
        membershipType: platform.type,
        itemId: item.id,
        state: lockState
      }
    ))
      .then(retryOnThrottled)
      .then(handleErrors, handleErrors);
  }
}

