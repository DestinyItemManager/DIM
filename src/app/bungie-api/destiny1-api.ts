import { Vendor } from 'app/destiny1/vendors/vendor.service';
import { t } from 'app/i18next-t';
import { DimError } from 'app/utils/dim-error';
import { errorLog } from 'app/utils/log';
import {
  DestinyEquipItemResults,
  PlatformErrorCodes,
  ServerResponse,
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { DestinyAccount } from '../accounts/destiny-account';
import { D1Item, DimItem } from '../inventory-stores/item-types';
import { D1Store } from '../inventory-stores/store-types';
import { bungieApiQuery, bungieApiUpdate } from './bungie-api-utils';
import { authenticatedHttpClient, handleUniquenessViolation } from './bungie-service-helper';

/**
 * APIs for interacting with Destiny 1 game data.
 *
 * DestinyService at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */

export async function getCharacters(platform: DestinyAccount) {
  const response = await authenticatedHttpClient(
    bungieApiQuery(
      `/D1/Platform/Destiny/${platform.originalPlatformType}/Account/${platform.membershipId}/`
    )
  );
  if (!response || Object.keys(response.Response).length === 0) {
    throw new DimError(
      'BungieService.NoAccountForPlatform',
      t('BungieService.NoAccountForPlatform', {
        platform: platform.platformLabel,
      })
    );
  }
  return _.map(response.Response.data.characters, (c) => {
    c.inventory = response.Response.data.inventory;
    return {
      id: c.characterBase.characterId,
      base: c,
      dateLastPlayed: c.characterBase.dateLastPlayed,
    };
  });
}

export async function getStores(platform: DestinyAccount): Promise<any[]> {
  const characters = await getCharacters(platform);
  const data = await Promise.all([
    getDestinyInventories(platform, characters),
    getDestinyProgression(platform, characters)
      // Don't let failure of progression fail other requests.
      .catch((e) => errorLog('bungie api', 'Failed to load character progression', e)),
    getDestinyAdvisors(platform, characters)
      // Don't let failure of advisors fail other requests.
      .catch((e) => errorLog('bungie api', 'Failed to load advisors', e)),
  ]);
  return data[0];
}

function processInventoryResponse(character: any, response: ServerResponse<any>) {
  const payload = response.Response;

  payload.id = character.id;
  payload.character = character;

  return payload;
}

function getDestinyInventories(platform: DestinyAccount, characters: any[]) {
  // Guardians
  const promises = characters.map((character) =>
    authenticatedHttpClient(
      bungieApiQuery(
        `/D1/Platform/Destiny/${platform.originalPlatformType}/Account/${platform.membershipId}/Character/${character.id}/Inventory/`
      )
    ).then((response) => processInventoryResponse(character, response))
  );

  // Vault
  const vault = {
    id: 'vault',
    base: null,
  };

  const vaultPromise = authenticatedHttpClient(
    bungieApiQuery(`/D1/Platform/Destiny/${platform.originalPlatformType}/MyAccount/Vault/`)
  ).then((response) => processInventoryResponse(vault, response));

  promises.push(vaultPromise);

  return Promise.all(promises);
}

export function getDestinyProgression(platform: DestinyAccount, characters: any[]) {
  const promises = characters.map(async (character) => {
    const response = await authenticatedHttpClient(
      bungieApiQuery(
        `/D1/Platform/Destiny/${platform.originalPlatformType}/Account/${platform.membershipId}/Character/${character.id}/Progression/`
      )
    );
    return processProgressionResponse(character, response);
  });

  function processProgressionResponse(character: any, response: ServerResponse<any>) {
    character.progression = response.Response.data;
    return character;
  }

  return Promise.all(promises);
}

export function getDestinyAdvisors(platform: DestinyAccount, characters: any[]) {
  const promises = characters.map(async (character) => {
    const response = await authenticatedHttpClient(
      bungieApiQuery(
        `/D1/Platform/Destiny/${platform.originalPlatformType}/Account/${platform.membershipId}/Character/${character.id}/Advisors/V2/`
      )
    );
    return processAdvisorsResponse(character, response);
  });

  return Promise.all(promises);

  function processAdvisorsResponse(character: any, response: ServerResponse<any>) {
    character.advisors = response.Response.data;
    return character;
  }
}

export async function getVendorForCharacter(
  account: DestinyAccount,
  character: D1Store,
  vendorHash: number
): Promise<Vendor> {
  const response = await authenticatedHttpClient(
    bungieApiQuery(
      `/D1/Platform/Destiny/${account.originalPlatformType}/MyAccount/Character/${character.id}/Vendor/${vendorHash}/`
    )
  );
  return response.Response.data;
}

export async function transfer(
  account: DestinyAccount,
  item: D1Item,
  store: D1Store,
  amount: number
) {
  try {
    return await authenticatedHttpClient(
      bungieApiUpdate('/D1/Platform/Destiny/TransferItem/', {
        characterId: store.isVault ? item.owner : store.id,
        membershipType: account.originalPlatformType,
        itemId: item.id,
        itemReferenceHash: item.hash,
        stackSize: amount || item.amount,
        transferToVault: store.isVault,
      })
    );
  } catch (e) {
    return handleUniquenessViolation(e, item, store);
  }
}

export function equip(account: DestinyAccount, item: DimItem) {
  return authenticatedHttpClient(
    bungieApiUpdate('/D1/Platform/Destiny/EquipItem/', {
      characterId: item.owner,
      membershipType: account.originalPlatformType,
      itemId: item.id,
    })
  );
}

/**
 * Equip items in bulk. Returns a mapping from item ID to error code for each item.
 */
export async function equipItems(
  account: DestinyAccount,
  store: D1Store,
  items: D1Item[]
): Promise<{ [itemInstanceId: string]: PlatformErrorCodes }> {
  // Sort exotics to the end. See https://github.com/DestinyItemManager/DIM/issues/323
  items = _.sortBy(items, (i) => (i.isExotic ? 1 : 0));

  const response = await authenticatedHttpClient(
    bungieApiUpdate('/D1/Platform/Destiny/EquipItems/', {
      characterId: store.id,
      membershipType: account.originalPlatformType,
      itemIds: items.map((i) => i.id),
    })
  );

  const data = response.Response as DestinyEquipItemResults;
  return Object.fromEntries(data.equipResults.map((r) => [r.itemInstanceId, r.equipStatus]));
}

export function setItemState(
  account: DestinyAccount,
  item: DimItem,
  storeId: string,
  lockState: boolean,
  type: 'lock' | 'track'
) {
  let method;
  switch (type) {
    case 'lock':
      method = 'SetLockState';
      break;
    case 'track':
      method = 'SetQuestTrackedState';
      break;
  }

  return authenticatedHttpClient(
    bungieApiUpdate(`/D1/Platform/Destiny/${method}/`, {
      characterId: storeId,
      membershipType: account.originalPlatformType,
      itemId: item.id,
      state: lockState,
    })
  );
}
