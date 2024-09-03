import { t } from 'app/i18next-t';
import { InGameLoadout } from 'app/loadout/loadout-types';
import { DimError } from 'app/utils/dim-error';
import { errorLog } from 'app/utils/log';
import {
  AwaAuthorizationResult,
  AwaType,
  BungieMembershipType,
  DestinyComponentType,
  DestinyItemComponentSetOfint32,
  DestinyLinkedProfilesResponse,
  DestinyManifest,
  DestinyProfileResponse,
  DestinyVendorResponse,
  DestinyVendorsResponse,
  PlatformErrorCodes,
  ServerResponse,
  awaGetActionToken,
  awaInitializeRequest,
  clearLoadout,
  equipItem,
  equipItems as equipItemsApi,
  equipLoadout,
  getDestinyManifest,
  getLinkedProfiles,
  getProfile as getProfileApi,
  getVendor as getVendorApi,
  getVendors as getVendorsApi,
  pullFromPostmaster,
  setItemLockState,
  setQuestTrackedState,
  snapshotLoadout,
  transferItem,
  updateLoadoutIdentifiers,
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { DestinyAccount } from '../accounts/destiny-account';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { reportException } from '../utils/sentry';
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
  bungieMembershipId: string,
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
export function getStores(platform: DestinyAccount): Promise<DestinyProfileResponse> {
  const components = [
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
    DestinyComponentType.Transitory,
    DestinyComponentType.CharacterLoadouts,
    DestinyComponentType.PresentationNodes,

    // This is a lot of data and currently not used.
    // DestinyComponentType.Craftables,
  ];

  return getProfile(platform, ...components);
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
      }),
    );
  }
  return response.Response;
}

export type LimitedDestinyVendorsResponse = Omit<DestinyVendorsResponse, 'itemComponents'> &
  Partial<{
    itemComponents: {
      [key: number]: Partial<DestinyItemComponentSetOfint32>;
    };
  }>;

export async function getVendors(
  account: DestinyAccount,
  characterId: string,
): Promise<LimitedDestinyVendorsResponse> {
  const response = await getVendorsApi(authenticatedHttpClient, {
    characterId,
    destinyMembershipId: account.membershipId,
    membershipType: account.originalPlatformType,
    components: [
      DestinyComponentType.Vendors,
      DestinyComponentType.VendorSales,
      DestinyComponentType.ItemCommonData,
      DestinyComponentType.CurrencyLookups,
    ],
  });
  return response.Response;
}

/** a single-vendor API fetch, focused on getting the sale item details. see loadAllVendors */
export async function getVendorSaleComponents(
  account: DestinyAccount,
  characterId: string,
  vendorHash: number,
): Promise<DestinyVendorResponse> {
  const response = await getVendorApi(authenticatedHttpClient, {
    characterId,
    destinyMembershipId: account.membershipId,
    membershipType: account.originalPlatformType,
    components: [
      DestinyComponentType.ItemInstances,
      DestinyComponentType.ItemObjectives,
      DestinyComponentType.ItemSockets,
      DestinyComponentType.ItemPlugStates,
      DestinyComponentType.ItemReusablePlugs,
      // TODO: We should try to defer this until the popup is open!
      DestinyComponentType.ItemPlugObjectives,
    ],
    vendorHash,
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
  amount: number,
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
  items: DimItem[],
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
    response.Response.equipResults.map((r) => [r.itemInstanceId, r.equipStatus]),
  );
}

/**
 * Set the lock state of an item.
 */
export function setLockState(
  account: DestinyAccount,
  storeId: string,
  item: DimItem,
  lockState: boolean,
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
  trackedState: boolean,
): Promise<ServerResponse<number>> {
  if (!item.trackable) {
    throw new Error("Can't track non-trackable items");
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
  item?: DimItem,
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

export async function equipInGameLoadout(account: DestinyAccount, loadout: InGameLoadout) {
  const result = equipLoadout(authenticatedHttpClient, {
    loadoutIndex: loadout.index,
    characterId: loadout.characterId,
    membershipType: account.originalPlatformType,
  });
  return result;
}

export async function snapshotInGameLoadout(account: DestinyAccount, loadout: InGameLoadout) {
  const result = snapshotLoadout(authenticatedHttpClient, {
    loadoutIndex: loadout.index,
    characterId: loadout.characterId,
    membershipType: account.originalPlatformType,
    colorHash: loadout.colorHash,
    iconHash: loadout.iconHash,
    nameHash: loadout.nameHash,
  });
  return result;
}

export async function clearInGameLoadout(account: DestinyAccount, loadout: InGameLoadout) {
  const result = clearLoadout(authenticatedHttpClient, {
    loadoutIndex: loadout.index,
    characterId: loadout.characterId,
    membershipType: account.originalPlatformType,
  });
  return result;
}

export async function editInGameLoadout(account: DestinyAccount, loadout: InGameLoadout) {
  const result = updateLoadoutIdentifiers(authenticatedHttpClient, {
    loadoutIndex: loadout.index,
    characterId: loadout.characterId,
    membershipType: account.originalPlatformType,
    colorHash: loadout.colorHash,
    iconHash: loadout.iconHash,
    nameHash: loadout.nameHash,
  });
  return result;
}
