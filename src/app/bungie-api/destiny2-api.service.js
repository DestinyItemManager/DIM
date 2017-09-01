import _ from 'underscore';
import { bungieApiQuery, bungieApiUpdate } from './bungie-api-utils';
import { DestinyComponentType } from './destiny-component-type';

/**
 * APIs for interacting with Destiny 2   game data.
 *
 * Destiny2 Service at https://destinydevs.github.io/BungieNetPlatform/docs/Endpoints
 */
export function Destiny2Api(
  BungieServiceHelper,
  $q,
  $http,
  $i18next) {
  'ngInject';
  const { handleErrors, retryOnThrottled } = BungieServiceHelper;

  return {
    getManifest,
    getProfile,
    transfer,
    equip,
    equipItems,
    setLockState
  };

  function getManifest() {
    return $http(bungieApiQuery('/Platform/Destiny2/Manifest/'))
      .then(handleErrors, handleErrors)
      .then((response) => response.data.Response);
  }

  /**
   * Get the user's whole profile on this platform. This includes characters, vault, and item information.
   */
  // TODO: allow for selecting specific components, or maybe make a few different calls? for example vendors vs activities vs inventory
  function getProfile(platform) {
    return $http(bungieApiQuery(
      `/Platform/Destiny2/${platform.platformType}/Profile/${platform.membershipId}/`,
      {
        components: [
          // TODO: this is a guess - when the game launches, dial these in. DIM uses a lot.
          DestinyComponentType.Profiles, // TODO: Don't think we need this
          DestinyComponentType.ProfileInventories,
          DestinyComponentType.ProfileCurrencies,
          DestinyComponentType.Characters,
          DestinyComponentType.CharacterInventories,
          DestinyComponentType.CharacterProgressions,
          DestinyComponentType.CharacterActivities,
          DestinyComponentType.CharacterEquipment,
          // TODO: consider loading less item data, and then loading item details on click? Makes searches hard though.
          DestinyComponentType.ItemInstances,
          DestinyComponentType.ItemObjectives,
          DestinyComponentType.ItemPerks,
          DestinyComponentType.ItemStats,
          DestinyComponentType.ItemSockets,
          DestinyComponentType.ItemTalentGrids,
          DestinyComponentType.ItemCommonData,
          DestinyComponentType.ItemPlugStates,
        ].join(',')
      }
    ))
    .then(handleErrors, handleErrors)
    .then((response) => {
      // TODO: what does it actually look like to not have an account?
      if (_.size(response.data.Response) === 0) {
        return $q.reject(new Error($i18next.t('BungieService.NoAccountForPlatform', {
          platform: platform.label
        })));
      }

      return response.data.Response;
    });
  }

  function transfer(platform, store, item, amount) {
    return $http(bungieApiUpdate(
      '/Platform/Destiny2/Actions/Items/TransferItem/',
      {
        characterId: store.isVault ? item.owner : store.id,
        membershipType: platform.platformType,
        itemId: item.id,
        itemReferenceHash: item.hash,
        stackSize: amount || item.amount,
        transferToVault: store.isVault
      }
    ))
      .then(retryOnThrottled)
      .then(handleErrors, handleErrors)
      .catch((e) => handleUniquenessViolation(e, item, store));

    // Handle "DestinyUniquenessViolation" (1648)
    function handleUniquenessViolation(e, item, store) {
      if (e && e.code === 1648) {
        const error = Error($i18next.t('BungieService.ItemUniquenessExplanation', {
          name: item.name,
          type: item.type.toLowerCase(),
          character: store.name,
          context: store.gender
        }));
        error.code = e.code;
        return $q.reject(error);
      }
      return $q.reject(e);
    }
  }

  function equip(platform, item) {
    return $http(bungieApiUpdate(
      '/Platform/Destiny2/Actions/Items/EquipItem/',
      {
        characterId: item.owner,
        membershipType: platform.platformType,
        itemId: item.id
      }
    ))
      .then(retryOnThrottled)
      .then(handleErrors, handleErrors);
  }

  // Returns a list of items that were successfully equipped
  function equipItems(platform, store, items) {
    // TODO: test if this is still broken in D2
    // Sort exotics to the end. See https://github.com/DestinyItemManager/DIM/issues/323
    items = _.sortBy(items, (i) => (i.isExotic ? 1 : 0));

    return $http(bungieApiUpdate(
      '/Platform/Destiny2/Actions/Items/EquipItems/',
      {
        characterId: store.id,
        membershipType: platform.platformType,
        itemIds: _.pluck(items, 'id')
      }))
      .then(retryOnThrottled)
      .then(handleErrors, handleErrors)
      .then((response) => {
        const data = response.data.Response;
        return items.filter((i) => {
          const item = _.find(data.equipResults, {
            itemInstanceId: i.id
          });
          return item && item.equipStatus === 1;
        });
      });
  }

  function setLockState(account, store, item, lockState) {
    return $http(bungieApiUpdate(
      `/Platform/Destiny2/Actions/Items/SetLockState/`,
      {
        characterId: store.isVault ? item.owner : store.id,
        membershipType: account.platformType,
        itemId: item.id,
        state: lockState
      }
    ))
      .then(retryOnThrottled)
      .then(handleErrors, handleErrors);
  }
}
