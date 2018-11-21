import { t } from 'i18next';
import * as _ from 'lodash';
import { bungieApiQuery, bungieApiUpdate } from './bungie-api-utils';
import { error, httpAdapter, handleUniquenessViolation } from './bungie-service-helper';
import { getActivePlatform } from '../accounts/platform.service';
import { DestinyManifest, ServerResponse } from 'bungie-api-ts/destiny2';
import { D1Store, DimStore } from '../inventory/store-types';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { D1Item, DimItem } from '../inventory/item-types';

/**
 * APIs for interacting with Destiny 1 game data.
 *
 * DestinyService at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */

export async function getManifest(): Promise<DestinyManifest> {
  const response = await httpAdapter(bungieApiQuery('/D1/Platform/Destiny/Manifest/'));
  return response.Response;
}

export async function getCharacters(platform: DestinyAccount) {
  const response = await httpAdapter(
    bungieApiQuery(
      `/D1/Platform/Destiny/${platform.platformType}/Account/${platform.membershipId}/`
    )
  );
  if (!response || Object.keys(response.Response).length === 0) {
    throw error(
      t('BungieService.NoAccountForPlatform', {
        platform: platform.platformLabel
      }),
      1601
    );
  }
  return _.map(response.Response.data.characters, (c: any) => {
    c.inventory = response.Response.data.inventory;
    return {
      id: c.characterBase.characterId,
      base: c
    };
  });
}

export async function getStores(platform: DestinyAccount): Promise<any> {
  const characters = await getCharacters(platform);
  const data = await Promise.all([
    getDestinyInventories(platform, characters),
    getDestinyProgression(platform, characters)
      // Don't let failure of progression fail other requests.
      .catch((e) => console.error('Failed to load character progression', e)),
    getDestinyAdvisors(platform, characters)
      // Don't let failure of advisors fail other requests.
      .catch((e) => console.error('Failed to load advisors', e))
  ]);
  return data[0];
}

function processInventoryResponse(character, response: ServerResponse<any>) {
  const payload = response.Response;

  payload.id = character.id;
  payload.character = character;

  return payload;
}

function getDestinyInventories(platform: DestinyAccount, characters: any[]) {
  // Guardians
  const promises = characters.map((character) => {
    return httpAdapter(
      bungieApiQuery(
        `/D1/Platform/Destiny/${platform.platformType}/Account/${platform.membershipId}/Character/${
          character.id
        }/Inventory/`
      )
    ).then((response) => processInventoryResponse(character, response));
  });

  // Vault
  const vault = {
    id: 'vault',
    base: null
  };

  const vaultPromise = httpAdapter(
    bungieApiQuery(`/D1/Platform/Destiny/${platform.platformType}/MyAccount/Vault/`)
  ).then((response) => processInventoryResponse(vault, response));

  promises.push(vaultPromise);

  return Promise.all(promises);
}

export function getDestinyProgression(platform: DestinyAccount, characters: any[]) {
  const promises = characters.map(async (character) => {
    const response = await httpAdapter(
      bungieApiQuery(
        `/D1/Platform/Destiny/${platform.platformType}/Account/${platform.membershipId}/Character/${
          character.id
        }/Progression/`
      )
    );
    return processProgressionResponse(character, response);
  });

  function processProgressionResponse(character, response: ServerResponse<any>) {
    character.progression = response.Response.data;
    return character;
  }

  return Promise.all(promises);
}

export function getDestinyAdvisors(platform: DestinyAccount, characters: any[]) {
  const promises = characters.map(async (character) => {
    const response = await httpAdapter(
      bungieApiQuery(
        `/D1/Platform/Destiny/${platform.platformType}/Account/${platform.membershipId}/Character/${
          character.id
        }/Advisors/V2/`
      )
    );
    return processAdvisorsResponse(character, response);
  });

  return Promise.all(promises);

  function processAdvisorsResponse(character, response: ServerResponse<any>) {
    character.advisors = response.Response.data;
    return character;
  }
}

export async function getVendorForCharacter(
  account: DestinyAccount,
  character: D1Store,
  vendorHash: number
) {
  const response = await httpAdapter(
    bungieApiQuery(
      `/D1/Platform/Destiny/${account.platformType}/MyAccount/Character/${
        character.id
      }/Vendor/${vendorHash}/`
    )
  );
  return response.Response.data;
}

export function transfer(item: D1Item, store: D1Store, amount: number) {
  const platform = getActivePlatform();
  const promise = httpAdapter(
    bungieApiUpdate('/D1/Platform/Destiny/TransferItem/', {
      characterId: store.isVault ? item.owner : store.id,
      membershipType: platform!.platformType,
      itemId: item.id,
      itemReferenceHash: item.hash,
      stackSize: amount || item.amount,
      transferToVault: store.isVault
    })
  ).catch((e) => handleUniquenessViolation(e, item, store));

  return promise;
}

export function equip(item: DimItem) {
  const platform = getActivePlatform();
  return httpAdapter(
    bungieApiUpdate('/D1/Platform/Destiny/EquipItem/', {
      characterId: item.owner,
      membershipType: platform!.platformType,
      itemId: item.id
    })
  );
}

// Returns a list of items that were successfully equipped
export async function equipItems(store: D1Store, items: D1Item[]) {
  // Sort exotics to the end. See https://github.com/DestinyItemManager/DIM/issues/323
  items = _.sortBy(items, (i: any) => {
    return i.isExotic ? 1 : 0;
  });

  const platform = getActivePlatform();
  const response = await httpAdapter(
    bungieApiUpdate('/D1/Platform/Destiny/EquipItems/', {
      characterId: store.id,
      membershipType: platform!.platformType,
      itemIds: items.map((i) => i.id)
    })
  );
  const data: any = response.Response;
  store.updateCharacterInfoFromEquip(data.summary);
  return items.filter((i: any) => {
    const item = data.equipResults.find((r) => r.itemInstanceId === i.id);
    return item && item.equipStatus === 1;
  });
}

export function setItemState(
  item: DimItem,
  store: DimStore,
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

  const platform = getActivePlatform();
  return httpAdapter(
    bungieApiUpdate(`/D1/Platform/Destiny/${method}/`, {
      characterId: store.isVault ? item.owner : store.id,
      membershipType: platform!.platformType,
      itemId: item.id,
      state: lockState
    })
  );
}
