import { IPromise } from 'angular';
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
  DestinyVendorsResponse
  } from 'bungie-api-ts/destiny2';
import { t } from 'i18next';
import * as _ from 'underscore';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { DimItem } from '../inventory/store/d2-item-factory.service';
import { DimStore } from '../inventory/store/d2-store-factory.service';
import { DimError, httpAdapter, httpAdapterWithRetry } from './bungie-service-helper';
import { getActivePlatform } from '../accounts/platform.service';

/**
 * APIs for interacting with Destiny 2 game data.
 *
 * Destiny2 Service at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */

 /**
  * Get the information about the current manifest.
  */
export function getManifest(): IPromise<DestinyManifest> {
  return getDestinyManifest(httpAdapter)
    .then((response) => response.Response) as IPromise<DestinyManifest>;
}

/**
 * Get the user's stores on this platform. This includes characters, vault, and item information.
 */
export function getStores(platform: DestinyAccount): IPromise<DestinyProfileResponse> {
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
export function getProgression(platform: DestinyAccount): IPromise<DestinyProfileResponse> {
  return getProfile(platform,
    DestinyComponentType.Characters,
    DestinyComponentType.CharacterProgressions,
    DestinyComponentType.ProfileInventories,
    DestinyComponentType.CharacterInventories,
    DestinyComponentType.ItemObjectives
  );
}

/**
 * Get just character info for all a user's characters on the given platform. No inventory, just enough to refresh stats.
 */
export function getCharacters(platform: DestinyAccount): IPromise<DestinyProfileResponse> {
  return getProfile(platform,
    DestinyComponentType.Characters
  );
}

/**
 * Get the minimum profile required to figure out if there are any characters.
 */
export function getBasicProfile(platform: DestinyAccount): IPromise<DestinyProfileResponse> {
  return getProfile(platform,
    DestinyComponentType.Profiles
  );
}

/**
 * Get parameterized profile information for the whole account. Pass in components to select what
 * you want. This can handle just characters, full inventory, vendors, kiosks, activities, etc.
 */
function getProfile(platform: DestinyAccount, ...components: DestinyComponentType[]): IPromise<DestinyProfileResponse> {
  return getProfileApi(httpAdapter, {
    destinyMembershipId: platform.membershipId,
    membershipType: platform.platformType,
    components
  })
  .then((response) => {
    // TODO: what does it actually look like to not have an account?
    if (_.size(response.Response) === 0) {
      throw new Error(t('BungieService.NoAccountForPlatform', {
        platform: platform.platformLabel
      }));
    }

    return response.Response;
  }) as IPromise<DestinyProfileResponse>;
}

export function getVendor(account: DestinyAccount, characterId: string, vendorHash: number): IPromise<DestinyVendorResponse> {
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
      DestinyComponentType.ItemPlugStates
    ],
    vendorHash
  })
  .then((response) => response.Response) as IPromise<DestinyVendorResponse>;
}

export function getVendors(account: DestinyAccount, characterId: string): IPromise<DestinyVendorsResponse> {
  return getVendorsApi(httpAdapter, {
    characterId,
    destinyMembershipId: account.membershipId,
    membershipType: account.platformType,
    components: []
  })
  .then((response) => response.Response) as IPromise<DestinyVendorsResponse>;
}

/**
 * Transfer an item to another store.
 */
export function transfer(item: DimItem, store: DimStore, amount: number): IPromise<ServerResponse<number>> {
  const platform = getActivePlatform();
  const request = {
    characterId: store.isVault ? item.owner : store.id,
    membershipType: platform!.platformType,
    itemId: item.id,
    itemReferenceHash: item.hash,
    stackSize: amount || item.amount,
    transferToVault: store.isVault
  };

  const response = item.location.inPostmaster
    ? pullFromPostmaster(httpAdapterWithRetry, request)
    : transferItem(httpAdapterWithRetry, request);
  return response.catch((e) => handleUniquenessViolation(e, item, store)) as IPromise<ServerResponse<number>>;

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

export function equip(item: DimItem): IPromise<ServerResponse<number>> {
  const platform = getActivePlatform();

  return equipItem(httpAdapterWithRetry, {
    characterId: item.owner,
    membershipType: platform!.platformType,
    itemId: item.id
  }) as IPromise<ServerResponse<number>>;
}

/**
 * Equip multiple items at once.
 * @returns a list of items that were successfully equipped
 */
export function equipItems(store: DimStore, items: DimItem[]): IPromise<DimItem[]> {
  // TODO: test if this is still broken in D2
  // Sort exotics to the end. See https://github.com/DestinyItemManager/DIM/issues/323
  items = _.sortBy(items, (i: any) => (i.isExotic ? 1 : 0));

  const platform = getActivePlatform();
  return equipItemsApi(httpAdapterWithRetry, {
    characterId: store.id,
    membershipType: platform!.platformType,
    itemIds: _.pluck(items, 'id')
  })
    .then((response) => {
      const data: DestinyEquipItemResults = response.Response;
      return items.filter((i) => {
        const item = _.find(data.equipResults, {
          itemInstanceId: i.id
        });
        return item && item.equipStatus === 1;
      });
    }) as IPromise<DimItem[]>;
}

/**
 * Set the lock state of an item.
 */
export function setLockState(store: DimStore, item: DimItem, lockState: boolean): IPromise<ServerResponse<number>> {
  const account = getActivePlatform();

  return setItemLockState(httpAdapterWithRetry, {
    characterId: store.isVault ? item.owner : store.id,
    membershipType: account!.platformType,
    itemId: item.id,
    state: lockState
  }) as IPromise<ServerResponse<number>>;
}
