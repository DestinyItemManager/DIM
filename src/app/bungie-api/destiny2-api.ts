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
  AwaAuthorizationResult,
  getLinkedProfiles,
  DestinyLinkedProfilesResponse,
  BungieMembershipType,
  getItem,
  DestinyItemResponse,
  setQuestTrackedState,
} from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import { DestinyAccount } from '../accounts/destiny-account';
import { httpAdapter, handleUniquenessViolation } from './bungie-service-helper';
import { getActivePlatform } from '../accounts/get-active-platform';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { reportException } from '../utils/exceptions';

/**
 * APIs for interacting with Destiny 2 game data.
 *
 * Destiny2 Service at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */

/**
 * Get the information about the current manifest.
 */
export async function getManifest(): Promise<DestinyManifest> {
  const response = await getDestinyManifest((config) => httpAdapter(config, true));
  return response.Response;
}

export async function getLinkedAccounts(
  bungieMembershipId: string
): Promise<DestinyLinkedProfilesResponse> {
  const response = await getLinkedProfiles(httpAdapter, {
    membershipId: bungieMembershipId,
    membershipType: BungieMembershipType.BungieNext,
    getAllMemberships: true,
  });
  return response.Response;
}

/**
 * Get the user's stores on this platform. This includes characters, vault, and item information.
 */
export function getStores(platform: DestinyAccount): Promise<DestinyProfileResponse> {
  return getProfile(
    platform,
    DestinyComponentType.Profiles,
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
    DestinyComponentType.Collectibles,
    DestinyComponentType.ItemPlugStates,
    DestinyComponentType.ItemReusablePlugs,
    // TODO: We should try to defer this until the popup is open!
    DestinyComponentType.ItemPlugObjectives,
    // TODO: we should defer this unless you're on the collections screen
    DestinyComponentType.Records,
    DestinyComponentType.Metrics
  );
}

/**
 * Get just character info for all a user's characters on the given platform. No inventory, just enough to refresh stats.
 */
export function getCharacters(platform: DestinyAccount): Promise<DestinyProfileResponse> {
  return getProfile(platform, DestinyComponentType.Characters);
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
    membershipType: platform.originalPlatformType,
    components,
  });
  // TODO: what does it actually look like to not have an account?
  if (Object.keys(response.Response).length === 0) {
    throw new Error(
      t('BungieService.NoAccountForPlatform', {
        platform: platform.platformLabel,
      })
    );
  }
  return response.Response;
}

/**
 * Get extra information about a single instanced item. This should be called from the
 * item popup only.
 */
export async function getItemDetails(
  itemInstanceId: string,
  account: DestinyAccount
): Promise<DestinyItemResponse> {
  const response = await getItem(httpAdapter, {
    destinyMembershipId: account.membershipId,
    membershipType: account.originalPlatformType,
    itemInstanceId,
    components: [
      // Get plug objectives (kill trackers and catalysts)
      DestinyComponentType.ItemPlugObjectives,
    ],
  });
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
    membershipType: account.originalPlatformType,
    components: [
      DestinyComponentType.Vendors,
      DestinyComponentType.VendorSales,
      DestinyComponentType.ItemInstances,
      DestinyComponentType.ItemObjectives,
      DestinyComponentType.ItemStats,
      DestinyComponentType.ItemSockets,
      DestinyComponentType.ItemTalentGrids,
      DestinyComponentType.ItemCommonData,
      DestinyComponentType.CurrencyLookups,
      DestinyComponentType.ItemPlugStates,
      DestinyComponentType.ItemReusablePlugs,
      // TODO: We should try to defer this until the popup is open!
      DestinyComponentType.ItemPlugObjectives,
    ],
    vendorHash,
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
    membershipType: account.originalPlatformType,
    components: [
      DestinyComponentType.Vendors,
      DestinyComponentType.VendorSales,
      DestinyComponentType.ItemInstances,
      DestinyComponentType.ItemObjectives,
      DestinyComponentType.ItemStats,
      DestinyComponentType.ItemSockets,
      DestinyComponentType.ItemTalentGrids,
      DestinyComponentType.ItemCommonData,
      DestinyComponentType.CurrencyLookups,
      DestinyComponentType.ItemPlugStates,
      DestinyComponentType.ItemReusablePlugs,
      // TODO: We should try to defer this until the popup is open!
      DestinyComponentType.ItemPlugObjectives,
    ],
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
    membershipType: account.originalPlatformType,
    components: [DestinyComponentType.Vendors],
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
    membershipType: platform!.originalPlatformType,
    itemId: item.id,
    itemReferenceHash: item.hash,
    stackSize: amount || item.amount,
    transferToVault: store.isVault,
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
    membershipType: platform!.originalPlatformType,
    itemId: item.id,
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
    membershipType: platform!.originalPlatformType,
    itemIds: items.map((i) => i.id),
  });
  const data: DestinyEquipItemResults = response.Response;
  return items.filter((i) => {
    const item = data.equipResults.find((r) => r.itemInstanceId === i.id);
    return item?.equipStatus === 1;
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
    membershipType: account!.originalPlatformType,
    itemId: item.id,
    state: lockState,
  });
}

/**
 * Set the tracked state of an item.
 */
export function setTrackedState(
  store: DimStore,
  item: DimItem,
  trackedState: boolean
): Promise<ServerResponse<number>> {
  const account = getActivePlatform();

  if (item.id === '0') {
    throw new Error("Can't track non-instanced items");
  }

  return setQuestTrackedState(httpAdapter, {
    characterId: store.isVault ? item.owner : store.id,
    membershipType: account!.originalPlatformType,
    itemId: item.id,
    state: trackedState,
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
    membershipType: account.originalPlatformType,
    affectedItemId: item ? item.id : undefined,
    characterId: item ? item.owner : undefined,
  });
  const awaTokenResult = await awaGetActionToken(httpAdapter, {
    correlationId: awaInitResult.Response.correlationId,
  });
  return awaTokenResult.Response;
}
