import angular from 'angular';
import _ from 'underscore';
import { bungieApiQuery, bungieApiUpdate } from './bungie-api-utils';

angular.module('dimApp')
  .factory('dimBungieService', BungieService);

function BungieService($rootScope, $q, $timeout, $http, $state, dimState, $i18next) {
  const service = {
    getAccounts: getAccounts,
    getAccountsForCurrentUser: getAccountsForCurrentUser,
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
  function handleErrors(response) {
    if (response.status === -1) {
      return $q.reject(new Error($i18next.t('BungieService.NotConnected')));
    }
    // Token expired and other auth maladies
    if (response.status === 401 || response.status === 403) {
      $rootScope.$broadcast('dim-no-token-found');
      return $q.reject(new Error($i18next.t('BungieService.NotLoggedIn')));
    }
    if (response.status >= 503 && response.status <= 526 /* cloudflare */) {
      return $q.reject(new Error($i18next.t('BungieService.Down')));
    }
    if (response.status < 200 || response.status >= 400) {
      return $q.reject(new Error($i18next.t('BungieService.NetworkError', {
        status: response.status,
        statusText: response.statusText
      })));
    }

    const errorCode = response.data ? response.data.ErrorCode : -1;

    // See https://github.com/DestinyDevs/BungieNetPlatform/wiki/Enums#platformerrorcodes
    switch (errorCode) {
    case 1: // Success
      return response;
    case 1627: // DestinyVendorNotFound
      return $q.reject(new Error($i18next.t('BungieService.VendorNotFound')));
    case 2106: // AuthorizationCodeInvalid
    case 2108: // AccessNotPermittedByApplicationScope
      $rootScope.$broadcast('dim-no-token-found');
      return $q.reject("DIM does not have permission to perform this action.");
    case 5: // SystemDisabled
      return $q.reject(new Error($i18next.t('BungieService.Maintenance')));
    case 35: // ThrottleLimitExceededMinutes
    case 36: // ThrottleLimitExceededMomentarily
    case 37: // ThrottleLimitExceededSeconds
      return $q.reject(new Error($i18next.t('BungieService.Throttled')));
    case 2111: // token expired
    case 99: // WebAuthRequired
      $rootScope.$broadcast('dim-no-token-found');
      return $q.reject(new Error($i18next.t('BungieService.NotLoggedIn')));
    case 1601: // DestinyAccountNotFound
    case 1618: // DestinyUnexpectedError
      if (response.config.url.indexOf('/Account/') >= 0 &&
          response.config.url.indexOf('/Character/') < 0) {
        const error = new Error($i18next.t('BungieService.NoAccount', { platform: dimState.active.label }));
        error.code = errorCode;
        return $q.reject(error);
      }
    case 2101: // ApiInvalidOrExpiredKey
    case 2102: // ApiKeyMissingFromRequest
    case 2107: // OriginHeaderDoesNotMatchKey
      if ($DIM_FLAVOR === 'dev') {
        $state.go('developer');
        return $q.reject(new Error($i18next.t('BungieService.DevVersion')));
      } else {
        return $q.reject(new Error($i18next.t('BungieService.Difficulties')));
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
        return $q.reject(new Error($i18next.t('BungieService.Difficulties')));
      }
    }

    return response;
  }

  function retryOnThrottled(response, retries = 3) {
    // TODO: these different statuses suggest different backoffs
    if (response.data &&
        // ThrottleLimitExceededMinutes
        (response.data.ErrorCode === 35 ||
         // ThrottleLimitExceededMomentarily
         response.data.ErrorCode === 36 ||
         // ThrottleLimitExceededSeconds
         response.data.ErrorCode === 37)) {
      if (retries <= 0) {
        return response;
      } else {
        return $timeout(Math.pow(2, 4 - retries) * 1000)
          .then(() => $http(response.config))
          .then((response) => retryOnThrottled(response, retries - 1));
      }
    } else {
      return response;
    }
  }

  function getManifest() {
    return $http(bungieApiQuery('/D1/Platform/Destiny/Manifest/'))
      .then(handleErrors, handleErrors)
      .then((response) => response.data.Response);
  }

  function getAccounts(bungieMembershipId) {
    return $http(bungieApiQuery(`/Platform/User/GetMembershipsById/${bungieMembershipId}/254/`))
      .then(handleErrors, handleErrors)
      .then((response) => response.data.Response);
  }

  // This is here just for migrating folks to GetMembershipsById
  function getAccountsForCurrentUser() {
    return $http(bungieApiQuery(`/Platform/User/GetMembershipsForCurrentUser/`))
      .then(handleErrors, handleErrors)
      .then((response) => response.data.Response);
  }

  function getCharacters(platform) {
    const charactersPromise = $http(bungieApiQuery(
      `/D1/Platform/Destiny/${platform.type}/Account/${platform.membershipId}/`
    ))
        .then(handleErrors, handleErrors)
        .then(processBnetCharactersRequest);

    return charactersPromise;

    function processBnetCharactersRequest(response) {
      if (_.size(response.data.Response) === 0) {
        return $q.reject(new Error($i18next.t('BungieService.NoAccountForPlatform', {
          platform: platform.label
        })));
      }

      return _.map(response.data.Response.data.characters, (c) => {
        c.inventory = response.data.Response.data.inventory;

        return {
          id: c.characterBase.characterId,
          base: c
        };
      });
    }
  }

  function getStores(platform) {
    return getCharacters(platform)
      .then((characters) => {
        return $q.all([
          getDestinyInventories(platform, characters),
          getDestinyProgression(platform, characters)
          // Don't let failure of progression fail other requests.
            .catch((e) => console.error("Failed to load character progression", e)),
          getDestinyAdvisors(platform, characters)
          // Don't let failure of advisors fail other requests.
            .catch((e) => console.error("Failed to load advisors", e))
        ]).then((data) => {
          return data[0];
        });
      })
      .catch((e) => {
        return $q.reject(e);
      });

    function processInventoryResponse(character, response) {
      const payload = response.data.Response;

      payload.id = character.id;
      payload.character = character;

      return payload;
    }

    function getDestinyInventories(platform, characters) {
      // Guardians
      const promises = characters.map((character) => {
        return $http(bungieApiQuery(
          `/D1/Platform/Destiny/${platform.type}/Account/${platform.membershipId}/Character/${character.id}/Inventory/`
        ))
          .then(handleErrors, handleErrors)
          .then((response) => processInventoryResponse(character, response));
      });

      // Vault
      const vault = {
        id: 'vault',
        base: null
      };

      const vaultPromise = $http(bungieApiQuery(`/D1/Platform/Destiny/${platform.type}/MyAccount/Vault/`))
        .then(handleErrors, handleErrors)
          .then((response) => processInventoryResponse(vault, response));

      promises.push(vaultPromise);

      return $q.all(promises);
    }
  }

  function getDestinyProgression(platform, characters) {
    const promises = characters.map((character) => {
      return $http(bungieApiQuery(
        `/D1/Platform/Destiny/${platform.type}/Account/${platform.membershipId}/Character/${character.id}/Progression/`
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

  function getDestinyAdvisors(platform, characters) {
    const promises = characters.map((character) => {
      return $http(bungieApiQuery(
        `/D1/Platform/Destiny/${platform.type}/Account/${platform.membershipId}/Character/${character.id}/Advisors/V2/`
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
    const platform = dimState.active;
    return $http(bungieApiQuery(
      `/D1/Platform/Destiny/${platform.type}/MyAccount/Character/${character.id}/Vendor/${vendorHash}/`
    ))
      .then(handleErrors, handleErrors)
      .then((response) => response.data.Response.data);
  }

  function transfer(item, store, amount) {
    const platform = dimState.active;
    const promise = $http(bungieApiUpdate(
      '/D1/Platform/Destiny/TransferItem/',
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
      .catch((e) => {
        return handleUniquenessViolation(e, item, store);
      });

    return promise;

    // Handle "DestinyUniquenessViolation" (1648)
    function handleUniquenessViolation(e, item, store) {
      if (e && e.code === 1648) {
        const error = Error($i18next.t('BungieService.ItemUniquenessExplanation', {
          name: item.name,
          type: item.type.toLowerCase(),
          character: store.name,
          context: store.gender
        }));
        error.code = e.code;
        return $q.reject(error);
      }
      return $q.reject(e);
    }
  }

  function equip(item) {
    const platform = dimState.active;
    return $http(bungieApiUpdate(
      '/D1/Platform/Destiny/EquipItem/',
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
    items = _.sortBy(items, (i) => {
      return i.isExotic ? 1 : 0;
    });

    const platform = dimState.active;
    return $http(bungieApiUpdate(
      '/D1/Platform/Destiny/EquipItems/',
      {
        characterId: store.id,
        membershipType: platform.type,
        itemIds: _.pluck(items, 'id')
      }))
      .then(retryOnThrottled)
      .then(handleErrors, handleErrors)
      .then((response) => {
        const data = response.data.Response;
        store.updateCharacterInfoFromEquip(data.summary);
        return _.select(items, (i) => {
          const item = _.find(data.equipResults, {
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

    const platform = dimState.active;
    return $http(bungieApiUpdate(
      `/D1/Platform/Destiny/${type}/`,
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
