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
import {
  D1CharacterWithInventory,
  D1GetAccountResponse,
  D1GetAdvisorsResponse,
  D1GetInventoryResponse,
  D1GetProgressionResponse,
  D1GetVaultInventoryResponse,
  D1MungedCharacter,
} from '../destiny1/d1-manifest-types';
import { DimItem } from '../inventory/item-types';
import { D1Store, DimStore } from '../inventory/store-types';
import { bungieApiQuery, bungieApiUpdate } from './bungie-api-utils';
import { authenticatedHttpClient, handleUniquenessViolation } from './bungie-service-helper';

/**
 * APIs for interacting with Destiny 1 game data.
 *
 * DestinyService at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */

export async function getCharacters(platform: DestinyAccount): Promise<D1MungedCharacter[]> {
  const response = (await authenticatedHttpClient(
    bungieApiQuery(
      `/D1/Platform/Destiny/${platform.originalPlatformType}/Account/${platform.membershipId}/`
    )
  )) as ServerResponse<D1GetAccountResponse>;
  if (!response || Object.keys(response.Response).length === 0) {
    throw new DimError(
      'BungieService.NoAccountForPlatform',
      t('BungieService.NoAccountForPlatform', {
        platform: platform.platformLabel,
      })
    );
  }
  return Object.values(response.Response.data.characters).map((c) => ({
    id: c.characterBase.characterId,
    // Why add the global inventory into each character?
    base: { ...c, inventory: response.Response.data.inventory },
    dateLastPlayed: c.characterBase.dateLastPlayed,
  }));
}

export async function getStores(platform: DestinyAccount): Promise<D1CharacterWithInventory[]> {
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

function getDestinyInventories(platform: DestinyAccount, characters: D1MungedCharacter[]) {
  // Guardians
  const promises: Promise<D1CharacterWithInventory>[] = characters.map(
    async (character): Promise<D1CharacterWithInventory> => {
      const response = (await authenticatedHttpClient(
        bungieApiQuery(
          `/D1/Platform/Destiny/${platform.originalPlatformType}/Account/${platform.membershipId}/Character/${character.id}/Inventory/`
        )
      )) as ServerResponse<D1GetInventoryResponse>;

      return { ...response.Response, character, type: 'character' };
    }
  );

  const vaultPromise: Promise<D1CharacterWithInventory> = (async () => {
    const response = (await authenticatedHttpClient(
      bungieApiQuery(`/D1/Platform/Destiny/${platform.originalPlatformType}/MyAccount/Vault/`)
    )) as ServerResponse<D1GetVaultInventoryResponse>;

    return {
      ...response.Response,
      character: {
        id: 'vault',
      },
      type: 'vault',
    };
  })();

  promises.push(vaultPromise);

  return Promise.all(promises);
}

function getDestinyProgression(platform: DestinyAccount, characters: D1MungedCharacter[]) {
  const promises = characters.map(async (character) => {
    const response = (await authenticatedHttpClient(
      bungieApiQuery(
        `/D1/Platform/Destiny/${platform.originalPlatformType}/Account/${platform.membershipId}/Character/${character.id}/Progression/`
      )
    )) as ServerResponse<D1GetProgressionResponse>;
    character.progression = response.Response.data;
  });

  return Promise.all(promises);
}

function getDestinyAdvisors(platform: DestinyAccount, characters: D1MungedCharacter[]) {
  const promises = characters.map(async (character) => {
    const response = (await authenticatedHttpClient(
      bungieApiQuery(
        `/D1/Platform/Destiny/${platform.originalPlatformType}/Account/${platform.membershipId}/Character/${character.id}/Advisors/V2/`
      )
    )) as ServerResponse<D1GetAdvisorsResponse>;
    character.advisors = response.Response.data;
  });

  return Promise.all(promises);
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
  item: DimItem,
  store: DimStore,
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
  store: DimStore,
  items: DimItem[]
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
