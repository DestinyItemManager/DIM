import {
  DestinyComponentType,
  DestinyEquipItemResults,
  DestinyManifest,
  DestinyProfileResponse,
  equipItem,
  equipItems as equipItemsApi,
  getDestinyManifest,
  getProfile as getProfileApi,
  getVendor as getVendorApi,
  getVendors as getVendorsApi,
  pullFromPostmaster,
  ServerResponse,
  setItemLockState,
  transferItem,
  DestinyVendorResponse,
  DestinyVendorsResponse,
  awaInitializeRequest,
  AwaType,
  awaGetActionToken,
  AwaAuthorizationResult
} from 'bungie-api-ts/destiny2';
import { t } from 'i18next';
import * as _ from 'lodash';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { httpAdapter, handleUniquenessViolation } from './bungie-service-helper';
import { getActivePlatform } from '../accounts/platform.service';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { reportException } from '../exceptions';

/**
 * APIs for interacting with Destiny 2 game data.
 *
 * Destiny2 Service at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */

/**
 * Get the information about the current manifest.
 */
export async function getManifest(): Promise<DestinyManifest> {
  const response = await getDestinyManifest(httpAdapter);
  return response.Response;
}

/**
 * Get the user's stores on this platform. This includes characters, vault, and item information.
 */
export function getStores(platform: DestinyAccount): Promise<DestinyProfileResponse> {
  return getProfile(
    platform,
    DestinyComponentType.ProfileInventories,
    DestinyComponentType.ProfileCurrencies,
    DestinyComponentType.Characters,
    DestinyComponentType.CharacterInventories,
    DestinyComponentType.CharacterProgressions,
    DestinyComponentType.CharacterEquipment,
    // TODO: consider loading less item data, and then loading item details on click? Makes searches hard though.
    DestinyComponentType.ItemInstances,
    DestinyComponentType.ItemObjectives,
    DestinyComponentType.ItemStats,
    DestinyComponentType.ItemSockets,
    DestinyComponentType.ItemTalentGrids,
    DestinyComponentType.ItemCommonData,
    DestinyComponentType.ItemPlugStates
  );
}

/**
 * Get the user's progression for all characters on this platform. This is a completely separate
 * call in hopes of separating the progress page into an independent thing.
 */
export function getProgression(platform: DestinyAccount): Promise<DestinyProfileResponse> {
  return getProfile(
    platform,
    DestinyComponentType.Characters,
    DestinyComponentType.CharacterProgressions,
    DestinyComponentType.ProfileInventories,
    DestinyComponentType.CharacterInventories,
    DestinyComponentType.ItemObjectives,
    DestinyComponentType.Records
  );
}

/**
 * Get the user's collections status for all characters on this platform. This is a completely separate
 * call in hopes of separating the collections page into an independent thing.
 */
export function getCollections(platform: DestinyAccount): Promise<DestinyProfileResponse> {
  return getProfile(
    platform,
    DestinyComponentType.ProfileInventories,
    DestinyComponentType.CharacterInventories,
    DestinyComponentType.CharacterEquipment,
    DestinyComponentType.Characters,
    DestinyComponentType.ItemInstances,
    DestinyComponentType.ItemObjectives,
    DestinyComponentType.ItemStats,
    DestinyComponentType.ItemSockets,
    DestinyComponentType.ItemTalentGrids,
    DestinyComponentType.ItemCommonData,
    DestinyComponentType.ItemPlugStates,
    DestinyComponentType.Collectibles
  );
}

/**
 * Get just character info for all a user's characters on the given platform. No inventory, just enough to refresh stats.
 */
export function getCharacters(platform: DestinyAccount): Promise<DestinyProfileResponse> {
  return getProfile(platform, DestinyComponentType.Characters);
}

/**
 * Get the minimum profile required to figure out if there are any characters.
 */
export function getBasicProfile(platform: DestinyAccount): Promise<DestinyProfileResponse> {
  return getProfile(platform, DestinyComponentType.Profiles);
}

/**
 * Get parameterized profile information for the whole account. Pass in components to select what
 * you want. This can handle just characters, full inventory, vendors, kiosks, activities, etc.
 */
async function getProfile(
  platform: DestinyAccount,
  ...components: DestinyComponentType[]
): Promise<DestinyProfileResponse> {
  const response = await getProfileApi(httpAdapter, {
    destinyMembershipId: platform.membershipId,
    membershipType: platform.platformType,
    components
  });
  // TODO: what does it actually look like to not have an account?
  if (Object.keys(response.Response).length === 0) {
    throw new Error(
      t('BungieService.NoAccountForPlatform', {
        platform: platform.platformLabel
      })
    );
  }
  return response.Response;
}

export async function getVendor(
  account: DestinyAccount,
  characterId: string,
  vendorHash: number
): Promise<DestinyVendorResponse> {
  const response = await getVendorApi(httpAdapter, {
    characterId,
    destinyMembershipId: account.membershipId,
    membershipType: account.platformType,
    components: [
      DestinyComponentType.Vendors,
      DestinyComponentType.VendorSales,
      DestinyComponentType.ItemInstances,
      DestinyComponentType.ItemObjectives,
      DestinyComponentType.ItemStats,
      DestinyComponentType.ItemSockets,
      DestinyComponentType.ItemTalentGrids,
      DestinyComponentType.ItemCommonData,
      DestinyComponentType.ItemPlugStates,
      DestinyComponentType.CurrencyLookups
    ],
    vendorHash
  });
  return response.Response;
}

export async function getVendors(
  account: DestinyAccount,
  characterId: string
): Promise<DestinyVendorsResponse> {
  const response = await getVendorsApi(httpAdapter, {
    characterId,
    destinyMembershipId: account.membershipId,
    membershipType: account.platformType,
    components: [
      DestinyComponentType.Vendors,
      DestinyComponentType.VendorSales,
      DestinyComponentType.ItemInstances,
      DestinyComponentType.ItemObjectives,
      DestinyComponentType.ItemStats,
      DestinyComponentType.ItemSockets,
      DestinyComponentType.ItemTalentGrids,
      DestinyComponentType.ItemCommonData,
      DestinyComponentType.ItemPlugStates,
      DestinyComponentType.CurrencyLookups
    ]
  });
  return response.Response;
}

/** Just get the vendors, for seasonal rank */
export async function getVendorsMinimal(
  account: DestinyAccount,
  characterId: string
): Promise<DestinyVendorsResponse> {
  const response = await getVendorsApi(httpAdapter, {
    characterId,
    destinyMembershipId: account.membershipId,
    membershipType: account.platformType,
    components: [DestinyComponentType.Vendors]
  });
  return response.Response;
}

/**
 * Transfer an item to another store.
 */
export async function transfer(
  item: DimItem,
  store: DimStore,
  amount: number
): Promise<ServerResponse<number>> {
  const platform = getActivePlatform();
  const request = {
    characterId: store.isVault || item.location.inPostmaster ? item.owner : store.id,
    membershipType: platform!.platformType,
    itemId: item.id,
    itemReferenceHash: item.hash,
    stackSize: amount || item.amount,
    transferToVault: store.isVault
  };

  const response = item.location.inPostmaster
    ? pullFromPostmaster(httpAdapter, request)
    : transferItem(httpAdapter, request);
  try {
    return response;
  } catch (e) {
    return handleUniquenessViolation(e, item, store);
  }
}

export function equip(item: DimItem): Promise<ServerResponse<number>> {
  const platform = getActivePlatform();

  if (item.owner === 'vault') {
    // TODO: trying to track down https://sentry.io/destiny-item-manager/dim/issues/541412672/?query=is:unresolved
    console.error('Cannot equip to vault!');
    reportException('equipVault', new Error('Cannot equip to vault'));
    return Promise.resolve({}) as Promise<ServerResponse<number>>;
  }

  return equipItem(httpAdapter, {
    characterId: item.owner,
    membershipType: platform!.platformType,
    itemId: item.id
  });
}

/**
 * Equip multiple items at once.
 * @returns a list of items that were successfully equipped
 */
export async function equipItems(store: DimStore, items: DimItem[]): Promise<DimItem[]> {
  // TODO: test if this is still broken in D2
  // Sort exotics to the end. See https://github.com/DestinyItemManager/DIM/issues/323
  items = _.sortBy(items, (i) => (i.isExotic ? 1 : 0));

  const platform = getActivePlatform();
  const response = await equipItemsApi(httpAdapter, {
    characterId: store.id,
    membershipType: platform!.platformType,
    itemIds: items.map((i) => i.id)
  });
  const data: DestinyEquipItemResults = response.Response;
  return items.filter((i) => {
    const item = data.equipResults.find((r) => r.itemInstanceId === i.id);
    return item && item.equipStatus === 1;
  });
}

/**
 * Set the lock state of an item.
 */
export function setLockState(
  store: DimStore,
  item: DimItem,
  lockState: boolean
): Promise<ServerResponse<number>> {
  const account = getActivePlatform();

  return setItemLockState(httpAdapter, {
    characterId: store.isVault ? item.owner : store.id,
    membershipType: account!.platformType,
    itemId: item.id,
    state: lockState
  });
}

// TODO: owner can't be "vault" I bet
export async function requestAdvancedWriteActionToken(
  account: DestinyAccount,
  action: AwaType,
  item?: DimItem
): Promise<AwaAuthorizationResult> {
  const awaInitResult = await awaInitializeRequest(httpAdapter, {
    type: action,
    membershipType: account.platformType,
    affectedItemId: item ? item.id : undefined,
    characterId: item ? item.owner : undefined
  });
  const awaTokenResult = await awaGetActionToken(httpAdapter, {
    correlationId: awaInitResult.Response.correlationId
  });
  return awaTokenResult.Response;
}
