import {
  DestinyCharacterComponent,
  SingleComponentResponse,
  DictionaryComponentResponse,
  DestinyCollectiblesComponent,
  DestinyProfileCollectiblesComponent,
  DestinyProfileResponse,
  DestinyCollectibleComponent,
  DestinyItemComponent,
} from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { DestinyAccount } from '../accounts/destiny-account';
import { getCharacters, getStores } from '../bungie-api/destiny2-api';
import { bungieErrorToaster } from '../bungie-api/error-toaster';
import { getDefinitions, D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { bungieNetPath } from '../dim-ui/BungieImage';
import { reportException } from '../utils/exceptions';
import { getLight } from '../loadout/loadout-utils';
import { resetIdTracker, processItems } from './store/d2-item-factory';
import { makeVault, makeCharacter, getCharacterStatsData } from './store/d2-store-factory';
import { cleanInfos } from './dim-item-info';
import { t } from 'app/i18next-t';
import { D2Vault, D2Store, D2StoreServiceType } from './store-types';
import { InventoryBuckets } from './inventory-buckets';
import { fetchRatings } from '../item-review/destiny-tracker.service';
import store from '../store/store';
import { update, loadNewItems, error, charactersUpdated, CharacterInfo } from './actions';
import { loadingTracker } from '../shell/loading-tracker';
import { showNotification } from '../notifications/notifications';
import { BehaviorSubject, Subject, ConnectableObservable } from 'rxjs';
import { switchMap, publishReplay, merge, take } from 'rxjs/operators';
import helmetIcon from '../../../destiny-icons/armor_types/helmet.svg';
import xpIcon from '../../images/xpIcon.svg';
import { maxLightItemSet } from 'app/loadout/auto-loadouts';
import { storesSelector, bucketsSelector } from './selectors';
import { ThunkResult } from 'app/store/types';
import { currentAccountSelector } from 'app/accounts/selectors';
import { getCharacterStatsData as getD1CharacterStatsData } from './store/character-utils';
import { getCharacters as d1GetCharacters } from '../bungie-api/destiny1-api';
import { getArtifactBonus } from './stores-helpers';
import { ItemPowerSet } from './ItemPowerSet';
import { StatHashes } from 'data/d2/generated-enums';

/**
 * Update the high level character information for all the stores
 * (level, power, stats, etc.). This does not update the
 * items in the stores.
 *
 * This works on both D1 and D2.
 *
 * TODO: Instead of this, update per-character after equip/dequip
 */
export function updateCharacters(): ThunkResult {
  return async (dispatch, getState) => {
    const account = currentAccountSelector(getState());
    if (!account) {
      return;
    }

    const defs =
      account.destinyVersion === 2
        ? getState().manifest.d2Manifest
        : getState().manifest.d1Manifest;

    if (!defs) {
      return;
    }

    let characters: CharacterInfo[] = [];
    if (account.destinyVersion === 2) {
      const profileInfo = await getCharacters(account);
      characters = profileInfo.characters.data
        ? Object.values(profileInfo.characters.data).map((character) => ({
            characterId: character.characterId,
            level: character.levelProgression.level,
            powerLevel: character.light,
            background: bungieNetPath(character.emblemBackgroundPath),
            icon: bungieNetPath(character.emblemPath),
            stats: getCharacterStatsData(getState().manifest.d2Manifest!, character.stats),
            color: character.emblemColor,
          }))
        : [];
    } else {
      const profileInfo = await d1GetCharacters(account);
      characters = profileInfo.map((character) => ({
        characterId: character.id,
        level: character.base.characterLevel,
        powerLevel: character.base.characterBase.powerLevel,
        percentToNextLevel: character.base.percentToNextLevel / 100,
        background: bungieNetPath(character.base.backgroundPath),
        icon: bungieNetPath(character.base.emblemPath),
        stats: getD1CharacterStatsData(
          getState().manifest.d1Manifest!,
          character.base.characterBase
        ),
      }));
    }

    dispatch(charactersUpdated(characters));
  };
}

export function mergeCollectibles(
  profileCollectibles: SingleComponentResponse<DestinyProfileCollectiblesComponent>,
  characterCollectibles: DictionaryComponentResponse<DestinyCollectiblesComponent>
) {
  const allCollectibles = {
    ...profileCollectibles.data?.collectibles,
  };

  _.forIn(characterCollectibles.data || {}, ({ collectibles }) => {
    Object.assign(allCollectibles, collectibles);
  });

  return allCollectibles;
}

export const D2StoresService = makeD2StoresService();

/**
 * TODO: For now this is a copy of StoreService customized for D2. Over time we should either
 * consolidate them, or at least organize them better.
 */
function makeD2StoresService(): D2StoreServiceType {
  // A subject that keeps track of the current account. Because it's a
  // behavior subject, any new subscriber will always see its last
  // value.
  const accountStream = new BehaviorSubject<DestinyAccount | null>(null);

  // The triggering observable for force-reloading stores.
  const forceReloadTrigger = new Subject();

  // A stream of stores that switches on account changes and supports reloading.
  // This is a ConnectableObservable that must be connected to start.
  const storesStream = accountStream.pipe(
    // But also re-emit the current value of the account stream
    // whenever the force reload triggers
    merge(forceReloadTrigger.pipe(switchMap(() => accountStream.pipe(take(1))))),
    // Whenever either trigger happens, load stores
    switchMap(loadingTracker.trackPromise(loadStores)),
    // Keep track of the last value for new subscribers
    publishReplay(1)
  ) as ConnectableObservable<D2Store[] | undefined>;

  // TODO: If we can make the store structures immutable, we could use
  //       distinctUntilChanged to avoid emitting store updates when
  //       nothing changed!

  const service = {
    getStores: () => storesSelector(store.getState()) as D2Store[],
    getStoresStream,
    reloadStores,
  };

  return service;

  /**
   * Set the current account, and get a stream of stores updates.
   * This will keep returning stores even if something else changes
   * the account by also calling "storesStream". This won't force the
   * stores to reload unless they haven't been loaded at all.
   *
   * @return a stream of store updates
   */
  function getStoresStream(account: DestinyAccount) {
    accountStream.next(account);
    // Start the stream the first time it's asked for. Repeated calls
    // won't do anything.
    storesStream.connect();
    return storesStream;
  }

  /**
   * Force the inventory and characters to reload.
   * @return the new stores
   */
  function reloadStores() {
    // adhere to the old contract by returning the next value as a
    // promise We take 2 from the stream because the publishReplay
    // will always return the latest value instantly, and we want the
    // next value (the refreshed value). toPromise returns the last
    // value in the sequence.
    const promise = storesStream.pipe(take(2)).toPromise();
    forceReloadTrigger.next(); // signal the force reload
    return promise;
  }

  /**
   * Returns a promise for a fresh view of the stores and their items.
   */
  async function loadStores(account: DestinyAccount): Promise<D2Store[] | undefined> {
    resetIdTracker();

    try {
      const [defs, , profileInfo] = await Promise.all([
        (store.dispatch(getDefinitions()) as any) as Promise<D2ManifestDefinitions>,
        store.dispatch(loadNewItems(account)),
        getStores(account),
      ]);
      const buckets = bucketsSelector(store.getState())!;
      console.time('Process inventory');

      // TODO: components may be hidden (privacy)

      if (
        !profileInfo.profileInventory.data ||
        !profileInfo.characterInventories.data ||
        !profileInfo.characters.data
      ) {
        console.error(
          'Vault or character inventory was missing - bailing in order to avoid corruption'
        );
        throw new Error(t('BungieService.Difficulties'));
      }

      const lastPlayedDate = findLastPlayedDate(profileInfo);

      const mergedCollectibles = mergeCollectibles(
        profileInfo.profileCollectibles,
        profileInfo.characterCollectibles
      );

      const vault = processVault(defs, buckets, profileInfo, mergedCollectibles);

      const characters = Object.keys(profileInfo.characters.data).map((characterId) =>
        processCharacter(
          defs,
          buckets,
          characterId,
          profileInfo,
          mergedCollectibles,
          lastPlayedDate
        )
      );

      const stores = [...characters, vault];

      updateVaultCounts(buckets, characters.find((c) => c.current)!, vault);

      if ($featureFlags.reviewsEnabled) {
        store.dispatch(fetchRatings(stores));
      }

      store.dispatch(cleanInfos(stores));

      for (const s of stores) {
        updateBasePower(stores, s, defs);
      }

      // Let our styling know how many characters there are
      // TODO: this should be an effect on the stores component, except it's also
      // used on D1 activities page
      document
        .querySelector('html')!
        .style.setProperty('--num-characters', String(stores.length - 1));
      console.timeEnd('Process inventory');

      console.time('Inventory state update');
      store.dispatch(update({ stores, profileResponse: profileInfo }));
      console.timeEnd('Inventory state update');

      return stores;
    } catch (e) {
      console.error('Error loading stores', e);
      reportException('d2stores', e);
      if (storesSelector(store.getState()).length > 0) {
        // don't replace their inventory with the error, just notify
        showNotification(bungieErrorToaster(e));
      } else {
        store.dispatch(error(e));
      }
      // It's important that we swallow all errors here - otherwise
      // our observable will fail on the first error. We could work
      // around that with some rxjs operators, but it's easier to
      // just make this never fail.
      return undefined;
    }
  }

  /**
   * Process a single character from its raw form to a DIM store, with all the items.
   */
  function processCharacter(
    defs: D2ManifestDefinitions,
    buckets: InventoryBuckets,
    characterId: string,
    profileInfo: DestinyProfileResponse,
    mergedCollectibles: {
      [hash: number]: DestinyCollectibleComponent;
    },
    lastPlayedDate: Date
  ): D2Store {
    const character = profileInfo.characters.data![characterId];
    const characterInventory = profileInfo.characterInventories.data?.[characterId]?.items || [];
    const profileInventory = profileInfo.profileInventory.data?.items || [];
    const characterEquipment = profileInfo.characterEquipment.data?.[characterId]?.items || [];
    const itemComponents = profileInfo.itemComponents;
    const progressions = profileInfo.characterProgressions.data?.[characterId]?.progressions || [];
    const uninstancedItemObjectives =
      profileInfo.characterProgressions.data?.[characterId].uninstancedItemObjectives || [];

    const store = makeCharacter(defs, character, lastPlayedDate);

    // This is pretty much just needed for the xp bar under the character header
    store.progression = progressions ? { progressions: Object.values(progressions) } : null;

    // We work around the weird account-wide buckets by assigning them to the current character
    const items = characterInventory.slice();
    for (const k in characterEquipment) {
      items.push(characterEquipment[k]);
    }

    if (store.current) {
      for (const i of profileInventory) {
        const bucket = buckets.byHash[i.bucketHash];
        // items that can be stored in a vault
        if (bucket && (bucket.vaultBucket || bucket.type === 'SpecialOrders')) {
          items.push(i);
        }
      }
    }

    const processedItems = processItems(
      defs,
      buckets,
      store,
      items,
      itemComponents,
      mergedCollectibles,
      uninstancedItemObjectives
    );
    store.items = processedItems;
    // by type-bucket
    store.buckets = _.groupBy(store.items, (i) => i.location.hash);
    // Fill in any missing buckets
    Object.values(buckets.byType).forEach((bucket) => {
      if (!store.buckets[bucket.hash]) {
        store.buckets[bucket.hash] = [];
      }
    });
    return store;
  }

  function processVault(
    defs: D2ManifestDefinitions,
    buckets: InventoryBuckets,
    profileInfo: DestinyProfileResponse,
    mergedCollectibles: {
      [hash: number]: DestinyCollectibleComponent;
    }
  ): D2Vault {
    const profileInventory = profileInfo.profileInventory.data
      ? profileInfo.profileInventory.data.items
      : [];
    const profileCurrencies = profileInfo.profileCurrencies.data
      ? profileInfo.profileCurrencies.data.items
      : [];
    const itemComponents = profileInfo.itemComponents;

    const store = makeVault(defs, profileCurrencies);

    const items: DestinyItemComponent[] = [];
    for (const i of profileInventory) {
      const bucket = buckets.byHash[i.bucketHash];
      // items that cannot be stored in the vault, and are therefore *in* a vault
      if (bucket && !bucket.vaultBucket && bucket.type !== 'SpecialOrders') {
        items.push(i);
      }
    }

    const processedItems = processItems(
      defs,
      buckets,
      store,
      items,
      itemComponents,
      mergedCollectibles
    );
    store.items = processedItems;
    // by type-bucket
    store.buckets = _.groupBy(store.items, (i) => i.location.hash);
    store.vaultCounts = {};
    // Fill in any missing buckets
    Object.values(buckets.byType).forEach((bucket) => {
      if (!store.buckets[bucket.hash]) {
        store.buckets[bucket.hash] = [];
      }
      if (bucket.vaultBucket) {
        const vaultBucketId = bucket.vaultBucket.hash;
        store.vaultCounts[vaultBucketId] = store.vaultCounts[vaultBucketId] || {
          count: 0,
          bucket: bucket.accountWide ? bucket : bucket.vaultBucket,
        };
        store.vaultCounts[vaultBucketId].count += store.buckets[bucket.hash].length;
      }
    });
    return store;
  }

  /**
   * Find the date of the most recently played character.
   */
  function findLastPlayedDate(profileInfo: DestinyProfileResponse) {
    return Object.values(profileInfo.characters.data!).reduce(
      (memo: Date, character: DestinyCharacterComponent) => {
        const d1 = new Date(character.dateLastPlayed);
        return memo ? (d1 >= memo ? d1 : memo) : d1;
      },
      new Date(0)
    );
  }

  // Add a fake stat for "max base power"
  function updateBasePower(stores: D2Store[], store: D2Store, defs: D2ManifestDefinitions) {
    if (!store.isVault) {
      const def = defs.Stat.get(StatHashes.Power);
      const { equippable, unrestricted } = maxLightItemSet(stores, store);
      const unrestrictedMaxGearPower = getLight(store, unrestricted);
      const unrestrictedPowerFloor = Math.floor(unrestrictedMaxGearPower);
      const equippableMaxGearPower = getLight(store, equippable);

      const hasClassified = stores.some((s) =>
        s.items.some(
          (i) =>
            i.classified &&
            (i.location.sort === 'Weapons' || i.location.sort === 'Armor' || i.type === 'Ghost')
        )
      );

      const differentEquippableMaxGearPower =
        (unrestrictedMaxGearPower !== equippableMaxGearPower && equippableMaxGearPower) ||
        undefined;

      store.stats.maxGearPower = {
        hash: -3,
        name: t('Stats.MaxGearPowerAll'),
        // used to be t('Stats.MaxGearPower'), a translation i don't want to lose yet
        hasClassified,
        description: '',
        differentEquippableMaxGearPower,
        richTooltip: ItemPowerSet(unrestricted, unrestrictedPowerFloor),
        value: unrestrictedMaxGearPower,
        icon: helmetIcon,
      };

      const artifactPower = getArtifactBonus(store);
      store.stats.powerModifier = {
        hash: -2,
        name: t('Stats.PowerModifier'),
        hasClassified: false,
        description: '',
        value: artifactPower,
        icon: xpIcon,
      };

      store.stats.maxTotalPower = {
        hash: -1,
        name: t('Stats.MaxTotalPower'),
        hasClassified,
        description: '',
        value: unrestrictedMaxGearPower + artifactPower,
        icon: bungieNetPath(def.displayProperties.icon),
      };
    }
  }

  // TODO: vault counts are silly and convoluted. We really need an
  // object to represent a Profile.
  function updateVaultCounts(buckets: InventoryBuckets, activeStore: D2Store, vault: D2Vault) {
    // Fill in any missing buckets
    Object.values(buckets.byType).forEach((bucket) => {
      if (bucket.accountWide && bucket.vaultBucket) {
        const vaultBucketId = bucket.hash;
        vault.vaultCounts[vaultBucketId] = vault.vaultCounts[vaultBucketId] || {
          count: 0,
          bucket,
        };
        vault.vaultCounts[vaultBucketId].count += activeStore.buckets[bucket.hash].length;
      }
    });
    activeStore.vault = vault; // god help me
  }
}
