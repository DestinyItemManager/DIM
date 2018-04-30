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
import * as _ from 'underscore';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { DimError, httpAdapter } from './bungie-service-helper';
import { getActivePlatform } from '../accounts/platform.service';
import { DimItem } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';

/**
 * APIs for interacting with Destiny 2 game data.
 *
 * Destiny2 Service at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */

 /**
  * Get the information about the current manifest.
  */
export function getManifest(): Promise<DestinyManifest> {
  return getDestinyManifest(httpAdapter)
    .then((response) => response.Response);
}

/**
 * Get the user's stores on this platform. This includes characters, vault, and item information.
 */
export function getStores(platform: DestinyAccount): Promise<DestinyProfileResponse> {
  return getProfile(platform,
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
  return getProfile(platform,
    DestinyComponentType.Characters,
    DestinyComponentType.CharacterProgressions,
    DestinyComponentType.ProfileInventories,
    DestinyComponentType.CharacterInventories,
    DestinyComponentType.ItemObjectives
  );
}

/**
 * Get the user's kiosk status for all characters on this platform. This is a completely separate
 * call in hopes of separating the collections page into an independent thing.
 */
export function getKiosks(platform: DestinyAccount): Promise<DestinyProfileResponse> {
  return getProfile(platform,
    DestinyComponentType.Characters,
    DestinyComponentType.ItemObjectives,
    DestinyComponentType.Kiosks,
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
 * Get just character info for all a user's characters on the given platform. No inventory, just enough to refresh stats.
 */
export function getCharacters(platform: DestinyAccount): Promise<DestinyProfileResponse> {
  return getProfile(platform,
    DestinyComponentType.Characters
  );
}

/**
 * Get the minimum profile required to figure out if there are any characters.
 */
export function getBasicProfile(platform: DestinyAccount): Promise<DestinyProfileResponse> {
  return getProfile(platform,
    DestinyComponentType.Profiles
  );
}

/**
 * Get parameterized profile information for the whole account. Pass in components to select what
 * you want. This can handle just characters, full inventory, vendors, kiosks, activities, etc.
 */
function getProfile(platform: DestinyAccount, ...components: DestinyComponentType[]): Promise<DestinyProfileResponse> {
  return getProfileApi(httpAdapter, {
    destinyMembershipId: platform.membershipId,
    membershipType: platform.platformType,
    components
  })
  .then((response) => {
    // TODO: what does it actually look like to not have an account?
    if (Object.keys(response.Response).length === 0) {
      throw new Error(t('BungieService.NoAccountForPlatform', {
        platform: platform.platformLabel
      }));
    }

    return response.Response;
  });
}

export function getVendor(account: DestinyAccount, characterId: string, vendorHash: number): Promise<DestinyVendorResponse> {
  return getVendorApi(httpAdapter, {
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
  })
  .then((response) => response.Response);
}

export function getVendors(account: DestinyAccount, characterId: string): Promise<DestinyVendorsResponse> {
  return getVendorsApi(httpAdapter, {
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
  })
  .then((response) => response.Response);
}

/**
 * Transfer an item to another store.
 */
export function transfer(item: DimItem, store: DimStore, amount: number): Promise<ServerResponse<number>> {
  const platform = getActivePlatform();
  const request = {
    characterId: (store.isVault || item.location.inPostmaster) ? item.owner : store.id,
    membershipType: platform!.platformType,
    itemId: item.id,
    itemReferenceHash: item.hash,
    stackSize: amount || item.amount,
    transferToVault: store.isVault
  };

  const response = item.location.inPostmaster
    ? pullFromPostmaster(httpAdapter, request)
    : transferItem(httpAdapter, request);
  return response.catch((e) => handleUniquenessViolation(e, item, store));

  // Handle "DestinyUniquenessViolation" (1648)
  function handleUniquenessViolation(e: DimError, item: DimItem, store: DimStore): never {
    if (e && e.code === 1648) {
      const error = new Error(t('BungieService.ItemUniquenessExplanation', {
        name: item.name,
        type: item.type.toLowerCase(),
        character: store.name,
        context: store.gender
      })) as DimError;
      error.code = e.code;
      throw error;
    }
    throw e;
  }
}

export function equip(item: DimItem): Promise<ServerResponse<number>> {
  const platform = getActivePlatform();

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
export function equipItems(store: DimStore, items: DimItem[]): Promise<DimItem[]> {
  // TODO: test if this is still broken in D2
  // Sort exotics to the end. See https://github.com/DestinyItemManager/DIM/issues/323
  items = _.sortBy(items, (i) => (i.isExotic ? 1 : 0));

  const platform = getActivePlatform();
  return equipItemsApi(httpAdapter, {
    characterId: store.id,
    membershipType: platform!.platformType,
    itemIds: items.map((i) => i.id)
  })
    .then((response) => {
      const data: DestinyEquipItemResults = response.Response;
      return items.filter((i) => {
        const item = data.equipResults.find((r) => r.itemInstanceId === i.id);
        return item && item.equipStatus === 1;
      });
    });
}

/**
 * Set the lock state of an item.
 */
export function setLockState(store: DimStore, item: DimItem, lockState: boolean): Promise<ServerResponse<number>> {
  const account = getActivePlatform();

  return setItemLockState(httpAdapter, {
    characterId: store.isVault ? item.owner : store.id,
    membershipType: account!.platformType,
    itemId: item.id,
    state: lockState
  });
}

// TODO: owner can't be "vault" I bet
export function requestAdvancedWriteActionToken(account: DestinyAccount, action: AwaType, item?: DimItem): Promise<AwaAuthorizationResult> {
  return awaInitializeRequest(httpAdapter, {
    type: action,
    membershipType: account.platformType,
    affectedItemId: item ? item.id : undefined,
    characterId: item ? item.owner : undefined
  })
    .then((result) => awaGetActionToken(httpAdapter, { correlationId: result.Response.correlationId }))
    .then((result) => result.Response);
}
