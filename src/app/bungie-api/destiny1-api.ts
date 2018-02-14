import * as _ from 'underscore';
import { bungieApiQuery, bungieApiUpdate } from './bungie-api-utils';
import { handleErrors, retryOnThrottled, error } from './bungie-service-helper';
import { t } from 'i18next';
import { state as dimState } from '../state';
import { $http, $q } from 'ngimport';

/**
 * APIs for interacting with Destiny 1 game data.
 *
 * DestinyService at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */

export function getManifest() {
  return $http(bungieApiQuery('/D1/Platform/Destiny/Manifest/'))
    .then(handleErrors, handleErrors)
    .then((response) => response.data.Response);
}

export function getCharacters(platform) {
  const charactersPromise = $http(bungieApiQuery(
    `/D1/Platform/Destiny/${platform.platformType}/Account/${platform.membershipId}/`
  ))
      .then(handleErrors, handleErrors)
      .then(processBnetCharactersRequest);

  return charactersPromise;

  function processBnetCharactersRequest(response) {
    if (!response.data || _.size(response.data.Response) === 0) {
      throw error(t('BungieService.NoAccountForPlatform', {
        platform: platform.label
      }), 1601);
    }

    return _.map(response.data.Response.data.characters, (c: any) => {
      c.inventory = response.data.Response.data.inventory;

      return {
        id: c.characterBase.characterId,
        base: c
      };
    });
  }
}

export function getStores(platform) {
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
        `/D1/Platform/Destiny/${platform.platformType}/Account/${platform.membershipId}/Character/${character.id}/Inventory/`
      ))
        .then(handleErrors, handleErrors)
        .then((response) => processInventoryResponse(character, response));
    });

    // Vault
    const vault = {
      id: 'vault',
      base: null
    };

    const vaultPromise = $http(bungieApiQuery(`/D1/Platform/Destiny/${platform.platformType}/MyAccount/Vault/`))
      .then(handleErrors, handleErrors)
        .then((response) => processInventoryResponse(vault, response));

    promises.push(vaultPromise);

    return $q.all(promises);
  }
}

export function getDestinyProgression(platform, characters) {
  const promises = characters.map((character) => {
    return $http(bungieApiQuery(
      `/D1/Platform/Destiny/${platform.platformType}/Account/${platform.membershipId}/Character/${character.id}/Progression/`
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

export function getDestinyAdvisors(platform, characters) {
  const promises = characters.map((character) => {
    return $http(bungieApiQuery(
      `/D1/Platform/Destiny/${platform.platformType}/Account/${platform.membershipId}/Character/${character.id}/Advisors/V2/`
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

export function getVendorForCharacter(account, character, vendorHash) {
  return $http(bungieApiQuery(
    `/D1/Platform/Destiny/${account.platformType}/MyAccount/Character/${character.id}/Vendor/${vendorHash}/`
  ))
    .then(handleErrors, handleErrors)
    .then((response: any) => response.data.Response.data);
}

export function transfer(item, store, amount) {
  const platform = dimState.active;
  const promise = $http(bungieApiUpdate(
    '/D1/Platform/Destiny/TransferItem/',
    {
      characterId: store.isVault ? item.owner : store.id,
      membershipType: platform.platformType,
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
      throw error(t('BungieService.ItemUniquenessExplanation', {
        name: item.name,
        type: item.type.toLowerCase(),
        character: store.name,
        context: store.gender
      }), e.code);
    }
    return $q.reject(e);
  }
}

export function equip(item) {
  const platform = dimState.active;
  return $http(bungieApiUpdate(
    '/D1/Platform/Destiny/EquipItem/',
    {
      characterId: item.owner,
      membershipType: platform.platformType,
      itemId: item.id
    }
  ))
    .then(retryOnThrottled)
    .then(handleErrors, handleErrors);
}

// Returns a list of items that were successfully equipped
export function equipItems(store, items) {
  // Sort exotics to the end. See https://github.com/DestinyItemManager/DIM/issues/323
  items = _.sortBy(items, (i: any) => {
    return i.isExotic ? 1 : 0;
  });

  const platform = dimState.active;
  return $http(bungieApiUpdate(
    '/D1/Platform/Destiny/EquipItems/',
    {
      characterId: store.id,
      membershipType: platform.platformType,
      itemIds: _.pluck(items, 'id')
    }))
    .then(retryOnThrottled)
    .then(handleErrors, handleErrors)
    .then((response) => {
      const data: any = response.data.Response;
      store.updateCharacterInfoFromEquip(data.summary);
      return items.filter((i: any) => {
        const item: any = _.find(data.equipResults, {
          itemInstanceId: i.id
        });
        return item && item.equipStatus === 1;
      });
    });
}

export function setItemState(item, store, lockState, type) {
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
      membershipType: platform.platformType,
      itemId: item.id,
      state: lockState
    }
  ))
    .then(retryOnThrottled)
    .then(handleErrors, handleErrors);
}
