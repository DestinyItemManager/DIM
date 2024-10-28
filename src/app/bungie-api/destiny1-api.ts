import { Vendor } from 'app/destiny1/vendors/vendor.service';
import { t } from 'app/i18next-t';
import { compareBy } from 'app/utils/comparators';
import { DimError } from 'app/utils/dim-error';
import { errorLog } from 'app/utils/log';
import {
  DestinyEquipItemResults,
  PlatformErrorCodes,
  ServerResponse,
} from 'bungie-api-ts/destiny2';
import { DestinyAccount } from '../accounts/destiny-account';
import {
  D1GetAccountResponse,
  D1GetAdvisorsResponse,
  D1GetInventoryResponse,
  D1GetProgressionResponse,
  D1GetVaultInventoryResponse,
  D1StoresData,
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

export async function getCharacters(account: DestinyAccount) {
  const response = await authenticatedHttpClient<ServerResponse<D1GetAccountResponse>>(
    bungieApiQuery(
      `/D1/Platform/Destiny/${account.originalPlatformType}/Account/${account.membershipId}/`,
    ),
  );
  if (!response || Object.keys(response.Response).length === 0) {
    throw new DimError(
      'BungieService.NoAccountForPlatform',
      t('BungieService.NoAccountForPlatform', {
        account: account.platformLabel,
      }),
    );
  }

  return response.Response.data;
}

export async function getStores(account: DestinyAccount): Promise<D1StoresData> {
  const { characters, inventory: profileInventory } = await getCharacters(account);

  const characterIds = characters.map((c) => c.characterBase.characterId);

  const [vaultInventory, characterInventories, characterProgressions, characterAdvisors] =
    await Promise.all([
      getVaultInventory(account),
      getDestinyInventories(account, characterIds),
      getDestinyProgression(account, characterIds)
        // Don't let failure of progression fail other requests.
        .catch((e) => {
          errorLog('bungie api', 'Failed to load character progression', e);
          return [];
        }),
      getDestinyAdvisors(account, characterIds)
        // Don't let failure of advisors fail other requests.
        .catch((e) => {
          errorLog('bungie api', 'Failed to load advisors', e);
          return [];
        }),
    ] as const);

  return {
    characters: characters.map((c, i) => ({
      id: characterIds[i],
      character: c,
      inventory: characterInventories[i],
      progression: characterProgressions[i],
      advisors: characterAdvisors[i],
    })),
    profileInventory,
    vaultInventory,
  };
}

function getDestinyInventories(account: DestinyAccount, characterIds: string[]) {
  // Guardians
  const promises = characterIds.map(async (characterId) => {
    const response = await authenticatedHttpClient<ServerResponse<D1GetInventoryResponse>>(
      bungieApiQuery(
        `/D1/Platform/Destiny/${account.originalPlatformType}/Account/${account.membershipId}/Character/${characterId}/Inventory/`,
      ),
    );

    return response.Response.data;
  });

  return Promise.all(promises);
}

async function getVaultInventory(account: DestinyAccount) {
  const response = await authenticatedHttpClient<ServerResponse<D1GetVaultInventoryResponse>>(
    bungieApiQuery(`/D1/Platform/Destiny/${account.originalPlatformType}/MyAccount/Vault/`),
  );

  return response.Response.data;
}

async function getDestinyProgression(account: DestinyAccount, characterIds: string[]) {
  const promises = characterIds.map(async (characterId) => {
    const response = await authenticatedHttpClient<ServerResponse<D1GetProgressionResponse>>(
      bungieApiQuery(
        `/D1/Platform/Destiny/${account.originalPlatformType}/Account/${account.membershipId}/Character/${characterId}/Progression/`,
      ),
    );
    return response.Response.data;
  });

  return Promise.all(promises);
}

async function getDestinyAdvisors(account: DestinyAccount, characterIds: string[]) {
  const promises = characterIds.map(async (characterId) => {
    const response = await authenticatedHttpClient<ServerResponse<D1GetAdvisorsResponse>>(
      bungieApiQuery(
        `/D1/Platform/Destiny/${account.originalPlatformType}/Account/${account.membershipId}/Character/${characterId}/Advisors/V2/`,
      ),
    );
    return response.Response.data;
  });

  return Promise.all(promises);
}

export async function getVendorForCharacter(
  account: DestinyAccount,
  character: D1Store,
  vendorHash: number,
): Promise<Vendor> {
  const response = await authenticatedHttpClient<ServerResponse<{ data: Vendor }>>(
    bungieApiQuery(
      `/D1/Platform/Destiny/${account.originalPlatformType}/MyAccount/Character/${character.id}/Vendor/${vendorHash}/`,
    ),
  );
  return response.Response.data;
}

export async function transfer(
  account: DestinyAccount,
  item: DimItem,
  store: DimStore,
  amount: number,
) {
  try {
    return await authenticatedHttpClient<ServerResponse<number>>(
      bungieApiUpdate('/D1/Platform/Destiny/TransferItem/', {
        characterId: store.isVault ? item.owner : store.id,
        membershipType: account.originalPlatformType,
        itemId: item.id,
        itemReferenceHash: item.hash,
        stackSize: amount || item.amount,
        transferToVault: store.isVault,
      }),
    );
  } catch (e) {
    return handleUniquenessViolation(e, item);
  }
}

export function equip(account: DestinyAccount, item: DimItem) {
  return authenticatedHttpClient<ServerResponse<number>>(
    bungieApiUpdate('/D1/Platform/Destiny/EquipItem/', {
      characterId: item.owner,
      membershipType: account.originalPlatformType,
      itemId: item.id,
    }),
  );
}

/**
 * Equip items in bulk. Returns a mapping from item ID to error code for each item.
 */
export async function equipItems(
  account: DestinyAccount,
  store: DimStore,
  items: DimItem[],
): Promise<{ [itemInstanceId: string]: PlatformErrorCodes }> {
  // Sort exotics to the end. See https://github.com/DestinyItemManager/DIM/issues/323
  const itemIds = items.toSorted(compareBy((i) => i.isExotic)).map((i) => i.id);

  const response = await authenticatedHttpClient<ServerResponse<DestinyEquipItemResults>>(
    bungieApiUpdate('/D1/Platform/Destiny/EquipItems/', {
      characterId: store.id,
      membershipType: account.originalPlatformType,
      itemIds,
    }),
  );

  const data = response.Response;
  return Object.fromEntries(data.equipResults.map((r) => [r.itemInstanceId, r.equipStatus]));
}

export function setItemState(
  account: DestinyAccount,
  item: DimItem,
  storeId: string,
  lockState: boolean,
  type: 'lock' | 'track',
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
    }),
  );
}
