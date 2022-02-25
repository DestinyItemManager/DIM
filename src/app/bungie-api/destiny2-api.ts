import { t } from 'app/i18next-t';
import { DimError } from 'app/utils/dim-error';
import { errorLog } from 'app/utils/log';
import {
  AwaAuthorizationResult,
  awaGetActionToken,
  awaInitializeRequest,
  AwaType,
  BungieMembershipType,
  DestinyCharacterResponse,
  DestinyComponentType,
  DestinyItemResponse,
  DestinyLinkedProfilesResponse,
  DestinyManifest,
  DestinyProfileResponse,
  DestinyVendorResponse,
  DestinyVendorsResponse,
  equipItem,
  equipItems as equipItemsApi,
  getCharacter as getCharacterApi,
  getDestinyManifest,
  getItem,
  getLinkedProfiles,
  getProfile as getProfileApi,
  getVendor as getVendorApi,
  getVendors as getVendorsApi,
  PlatformErrorCodes,
  pullFromPostmaster,
  ServerResponse,
  setItemLockState,
  setQuestTrackedState,
  transferItem,
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { DestinyAccount } from '../accounts/destiny-account';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { reportException } from '../utils/exceptions';
import {
  authenticatedHttpClient,
  handleUniquenessViolation,
  unauthenticatedHttpClient,
} from './bungie-service-helper';

/**
 * APIs for interacting with Destiny 2 game data.
 *
 * Destiny2 Service at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */

/**
 * Get the information about the current manifest.
 */
export async function getManifest(): Promise<DestinyManifest> {
  const response = await getDestinyManifest(unauthenticatedHttpClient);
  return response.Response;
}

export async function getLinkedAccounts(
  bungieMembershipId: string
): Promise<DestinyLinkedProfilesResponse> {
  const response = await getLinkedProfiles(authenticatedHttpClient, {
    membershipId: bungieMembershipId,
    membershipType: BungieMembershipType.BungieNext,
    getAllMemberships: true,
  });
  return response.Response;
}

/**
 * Get the user's stores on this platform. This includes characters, vault, and item information.
 */
export function getStores(
  platform: DestinyAccount,
  components?: DestinyComponentType[]
): Promise<DestinyProfileResponse> {
  const defaultComponents = [
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
    DestinyComponentType.Metrics,
    DestinyComponentType.StringVariables,
    DestinyComponentType.ProfileProgression,
    DestinyComponentType.Craftables,
  ];

  return getProfile(platform, ...(components || defaultComponents));
}

/**
 * Get just character info for all a user's characters on the given platform. No inventory, just enough to refresh stats.
 */
export function getCharacters(platform: DestinyAccount): Promise<DestinyProfileResponse> {
  return getProfile(platform, DestinyComponentType.Characters);
}

/**
 * Get character info for on the given platform. No inventory, just enough to refresh activity.
 */
export function getCurrentActivity(
  platform: DestinyAccount,
  characterId: string
): Promise<DestinyCharacterResponse> {
  return getCharacter(platform, characterId, DestinyComponentType.CharacterActivities);
}

async function getCharacter(
  platform: DestinyAccount,
  characterId: string,
  ...components: DestinyComponentType[]
): Promise<DestinyCharacterResponse> {
  const response = await getCharacterApi(authenticatedHttpClient, {
    destinyMembershipId: platform.membershipId,
    characterId,
    membershipType: platform.originalPlatformType,
    components,
  });

  return response.Response;
}

/**
 * Get parameterized profile information for the whole account. Pass in components to select what
 * you want. This can handle just characters, full inventory, vendors, kiosks, activities, etc.
 */
async function getProfile(
  platform: DestinyAccount,
  ...components: DestinyComponentType[]
): Promise<DestinyProfileResponse> {
  const response = await getProfileApi(authenticatedHttpClient, {
    destinyMembershipId: platform.membershipId,
    membershipType: platform.originalPlatformType,
    components,
  });
  // TODO: what does it actually look like to not have an account?
  if (Object.keys(response.Response).length === 0) {
    throw new DimError(
      'BungieService.NoAccountForPlatform',
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
export async function getItemPopupDetails(
  itemInstanceId: string,
  account: DestinyAccount
): Promise<DestinyItemResponse> {
  const response = await getItem(authenticatedHttpClient, {
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

/**
 * Get all information about a single instanced item.
 */
export async function getSingleItem(
  itemInstanceId: string,
  account: DestinyAccount
): Promise<DestinyItemResponse> {
  const response = await getItem(authenticatedHttpClient, {
    destinyMembershipId: account.membershipId,
    membershipType: account.originalPlatformType,
    itemInstanceId,
    components: [
      DestinyComponentType.ItemInstances,
      DestinyComponentType.ItemObjectives,
      DestinyComponentType.ItemSockets,
      DestinyComponentType.ItemTalentGrids,
      DestinyComponentType.ItemCommonData,
      DestinyComponentType.ItemPlugStates,
      DestinyComponentType.ItemReusablePlugs,
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
  const response = await getVendorApi(authenticatedHttpClient, {
    characterId,
    destinyMembershipId: account.membershipId,
    membershipType: account.originalPlatformType,
    components: [
      DestinyComponentType.Vendors,
      DestinyComponentType.VendorSales,
      DestinyComponentType.ItemInstances,
      DestinyComponentType.ItemObjectives,
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
  const response = await getVendorsApi(authenticatedHttpClient, {
    characterId,
    destinyMembershipId: account.membershipId,
    membershipType: account.originalPlatformType,
    components: [
      DestinyComponentType.Vendors,
      DestinyComponentType.VendorSales,
      DestinyComponentType.ItemInstances,
      DestinyComponentType.ItemObjectives,
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

/**
 * Transfer an item to another store.
 */
export async function transfer(
  account: DestinyAccount,
  item: DimItem,
  store: DimStore,
  amount: number
): Promise<ServerResponse<number>> {
  const request = {
    characterId: store.isVault || item.location.inPostmaster ? item.owner : store.id,
    membershipType: account.originalPlatformType,
    itemId: item.id,
    itemReferenceHash: item.hash,
    stackSize: amount || item.amount,
    transferToVault: store.isVault,
  };

  const response = item.location.inPostmaster
    ? pullFromPostmaster(authenticatedHttpClient, request)
    : transferItem(authenticatedHttpClient, request);
  try {
    return await response;
  } catch (e) {
    return handleUniquenessViolation(e, item, store);
  }
}

export function equip(account: DestinyAccount, item: DimItem): Promise<ServerResponse<number>> {
  if (item.owner === 'vault') {
    // TODO: trying to track down https://sentry.io/destiny-item-manager/dim/issues/541412672/?query=is:unresolved
    errorLog('bungie api', 'Cannot equip to vault!');
    reportException('equipVault', new Error('Cannot equip to vault'));
    return Promise.resolve({}) as Promise<ServerResponse<number>>;
  }

  return equipItem(authenticatedHttpClient, {
    characterId: item.owner,
    membershipType: account.originalPlatformType,
    itemId: item.id,
  });
}

/**
 * Equip items in bulk. Returns a mapping from item ID to error code for each item
 */
export async function equipItems(
  account: DestinyAccount,
  store: DimStore,
  items: DimItem[]
): Promise<{ [itemInstanceId: string]: PlatformErrorCodes }> {
  // TODO: test if this is still broken in D2
  // Sort exotics to the end. See https://github.com/DestinyItemManager/DIM/issues/323
  items = _.sortBy(items, (i) => (i.isExotic ? 1 : 0));

  const response = await equipItemsApi(authenticatedHttpClient, {
    characterId: store.id,
    membershipType: account.originalPlatformType,
    itemIds: items.map((i) => i.id),
  });
  return Object.fromEntries(
    response.Response.equipResults.map((r) => [r.itemInstanceId, r.equipStatus])
  );
}

/**
 * Set the lock state of an item.
 */
export function setLockState(
  account: DestinyAccount,
  storeId: string,
  item: DimItem,
  lockState: boolean
): Promise<ServerResponse<number>> {
  return setItemLockState(authenticatedHttpClient, {
    characterId: storeId,
    membershipType: account.originalPlatformType,
    itemId: item.id,
    state: lockState,
  });
}

/**
 * Set the tracked state of an item.
 */
export function setTrackedState(
  account: DestinyAccount,
  storeId: string,
  item: DimItem,
  trackedState: boolean
): Promise<ServerResponse<number>> {
  if (item.id === '0') {
    throw new Error("Can't track non-instanced items");
  }

  return setQuestTrackedState(authenticatedHttpClient, {
    characterId: storeId,
    membershipType: account.originalPlatformType,
    itemId: item.id,
    state: trackedState,
  });
}

export async function requestAdvancedWriteActionToken(
  account: DestinyAccount,
  action: AwaType,
  storeId: string,
  item?: DimItem
): Promise<AwaAuthorizationResult> {
  const awaInitResult = await awaInitializeRequest(authenticatedHttpClient, {
    type: action,
    membershipType: account.originalPlatformType,
    affectedItemId: item ? item.id : undefined,
    characterId: storeId,
  });
  const awaTokenResult = await awaGetActionToken(authenticatedHttpClient, {
    correlationId: awaInitResult.Response.correlationId,
  });
  return awaTokenResult.Response;
}
