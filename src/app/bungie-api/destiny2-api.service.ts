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
  pullFromPostmaster,
  ServerResponse,
  setItemLockState,
  transferItem
  } from 'bungie-api-ts/destiny2';
import * as _ from 'underscore';
import { DimItem } from '../inventory/store/d2-item-factory.service';
import { DimStore } from '../inventory/store/d2-store-factory.service';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { BungieServiceHelperType, DimError } from './bungie-service-helper.service';

export interface Destiny2ApiService {
  getManifest(): IPromise<DestinyManifest>;
  getStores(platform: DestinyAccount): IPromise<DestinyProfileResponse>;
  getProgression(platform: DestinyAccount): IPromise<DestinyProfileResponse>;
  getBasicProfile(platform: DestinyAccount): IPromise<DestinyProfileResponse>;
  getCharacters(platform: DestinyAccount): IPromise<DestinyProfileResponse>;
  transfer(item: DimItem, store: DimStore, amount: number): IPromise<ServerResponse<number>>;
  equip(item: DimItem): IPromise<ServerResponse<number>>;
  equipItems(store: DimStore, items: DimItem[]): IPromise<ServerResponse<number>>;
  setLockState(store: DimStore, item: DimItem, lockState: boolean): IPromise<ServerResponse<number>>;
}

/**
 * APIs for interacting with Destiny 2 game data.
 *
 * Destiny2 Service at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */
export function Destiny2Api(
  BungieServiceHelper: BungieServiceHelperType,
  dimState,
  $i18next
): Destiny2ApiService {
  'ngInject';
  const { httpAdapter, httpAdapterWithRetry } = BungieServiceHelper;

  return {
    getManifest,
    getStores,
    getProgression,
    getBasicProfile,
    getCharacters,
    transfer,
    equip,
    equipItems,
    setLockState
  };

  function getManifest(): IPromise<DestinyManifest> {
    return getDestinyManifest(httpAdapter)
      .then((response) => response.Response) as IPromise<DestinyManifest>;
  }

  /**
   * Get the user's stores on this platform. This includes characters, vault, and item information.
   */
  function getStores(platform: DestinyAccount): IPromise<DestinyProfileResponse> {
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
  function getProgression(platform: DestinyAccount): IPromise<DestinyProfileResponse> {
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
  function getCharacters(platform): IPromise<DestinyProfileResponse> {
    return getProfile(platform,
      DestinyComponentType.Characters
    );
  }

  function getBasicProfile(platform): IPromise<DestinyProfileResponse> {
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
        throw new Error($i18next.t('BungieService.NoAccountForPlatform', {
          platform: platform.platformLabel
        }));
      }

      return response.Response;
    }) as IPromise<DestinyProfileResponse>;
  }

  function transfer(item: DimItem, store: DimStore, amount: number): IPromise<ServerResponse<number>> {
    const platform = dimState.active;
    const request = {
      characterId: store.isVault ? item.owner : store.id,
      membershipType: platform.platformType,
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
        const error = new Error($i18next.t('BungieService.ItemUniquenessExplanation', {
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

  function equip(item: DimItem): IPromise<ServerResponse<number>> {
    const platform = dimState.active;

    return equipItem(httpAdapterWithRetry, {
      characterId: item.owner,
      membershipType: platform.platformType,
      itemId: item.id
    }) as IPromise<ServerResponse<number>>;
  }

  // Returns a list of items that were successfully equipped
  function equipItems(store: DimStore, items: DimItem[]): IPromise<any> {
    // TODO: test if this is still broken in D2
    // Sort exotics to the end. See https://github.com/DestinyItemManager/DIM/issues/323
    items = _.sortBy(items, (i: any) => (i.isExotic ? 1 : 0));

    const platform = dimState.active;
    return equipItemsApi(httpAdapterWithRetry, {
      characterId: store.id,
      membershipType: platform.platformType,
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

  function setLockState(store: DimStore, item: DimItem, lockState: boolean): IPromise<ServerResponse<number>> {
    const account = dimState.active;

    return setItemLockState(httpAdapterWithRetry, {
      characterId: store.isVault ? item.owner : store.id,
      membershipType: account.platformType,
      itemId: item.id,
      state: lockState
    }) as IPromise<ServerResponse<number>>;
  }
}
