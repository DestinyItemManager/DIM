import { getCurrentHub, startTransaction } from '@sentry/browser';
import { Transaction } from '@sentry/types';
import { handleAuthErrors } from 'app/accounts/actions';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { getPlatforms } from 'app/accounts/platforms';
import { currentAccountSelector } from 'app/accounts/selectors';
import { loadClarity } from 'app/clarity/descriptions/loadDescriptions';
import { t } from 'app/i18next-t';
import { maxLightItemSet } from 'app/loadout-drawer/auto-loadouts';
import { d2ManifestSelector, manifestSelector } from 'app/manifest/selectors';
import { getCharacterProgressions } from 'app/progress/selectors';
import { get, set } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import { DimError } from 'app/utils/dim-error';
import { errorLog, infoLog, timer, warnLog } from 'app/utils/log';
import {
  DestinyCharacterProgressionComponent,
  DestinyCollectibleComponent,
  DestinyCollectiblesComponent,
  DestinyItemComponent,
  DestinyProfileCollectiblesComponent,
  DestinyProfileResponse,
  DictionaryComponentResponse,
  SingleComponentResponse,
} from 'bungie-api-ts/destiny2';
import { BucketHashes, StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import helmetIcon from '../../../destiny-icons/armor_types/helmet.svg';
import xpIcon from '../../images/xpIcon.svg';
import { getCharacters as d1GetCharacters } from '../bungie-api/destiny1-api';
import { getCharacters, getStores } from '../bungie-api/destiny2-api';
import { bungieErrorToaster } from '../bungie-api/error-toaster';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions';
import { bungieNetPath } from '../dim-ui/BungieImage';
import { getLight } from '../loadout-drawer/loadout-utils';
import { showNotification } from '../notifications/notifications';
import { loadingTracker } from '../shell/loading-tracker';
import { reportException } from '../utils/exceptions';
import {
  CharacterInfo,
  charactersUpdated,
  error,
  loadNewItems,
  profileError,
  profileLoaded,
  update,
} from './actions';
import { ArtifactXP } from './ArtifactXP';
import { cleanInfos } from './dim-item-info';
import { InventoryBuckets } from './inventory-buckets';
import { DimItem } from './item-types';
import { ItemPowerSet } from './ItemPowerSet';
import {
  d2BucketsSelector,
  getBucketsWithClassifiedItems,
  hasAffectingClassified,
  storesLoadedSelector,
  storesSelector,
} from './selectors';
import { DimCharacterStat, DimStore } from './store-types';
import { getCharacterStatsData as getD1CharacterStatsData } from './store/character-utils';
import { processItems } from './store/d2-item-factory';
import { getCharacterStatsData, makeCharacter, makeVault } from './store/d2-store-factory';
import { resetItemIndexGenerator } from './store/item-index';
import { getArtifactBonus } from './stores-helpers';

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

    const defs = manifestSelector(getState());
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
            stats: getCharacterStatsData(d2ManifestSelector(getState())!, character.stats),
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

    // If we switched account since starting this, give up
    if (account !== currentAccountSelector(getState())) {
      return;
    }

    dispatch(charactersUpdated(characters));
  };
}

export function mergeCollectibles(
  profileCollectibles: SingleComponentResponse<DestinyProfileCollectiblesComponent>,
  characterCollectibles: DictionaryComponentResponse<DestinyCollectiblesComponent>
) {
  const allCollectibles = {
    ...profileCollectibles?.data?.collectibles,
  };

  _.forIn(characterCollectibles?.data || {}, ({ collectibles }) => {
    Object.assign(allCollectibles, collectibles);
  });

  return allCollectibles;
}

/**
 * Returns a promise for a fresh view of the stores and their items.
 */

export function loadStores(): ThunkResult<DimStore[] | undefined> {
  return async (dispatch, getState) => {
    let account = currentAccountSelector(getState());
    if (!account) {
      // TODO: throw here?
      await dispatch(getPlatforms());
      account = currentAccountSelector(getState());
      if (!account || account.destinyVersion !== 2) {
        return;
      }
    }

    $featureFlags.clarityDescriptions && dispatch(loadClarity()); // no need to await
    await dispatch(loadNewItems(account));
    const stores = await dispatch(loadStoresData(account));
    return stores;
  };
}

// time in milliseconds after which we could expect Bnet to return an updated response
const BUNGIE_CACHE_TTL = 15_000;

let minimumCacheAge = Number.MAX_SAFE_INTEGER;

function loadProfile(account: DestinyAccount): ThunkResult<DestinyProfileResponse | undefined> {
  return async (dispatch, getState) => {
    const mockProfileData = getState().inventory.mockProfileData;
    if (mockProfileData) {
      // TODO: can/should we replace this with profileResponse plus the readOnly flag?
      return mockProfileData;
    }

    // First try loading from IndexedDB
    let profileResponse = getState().inventory.profileResponse;
    if (!profileResponse) {
      profileResponse = await get<DestinyProfileResponse>(`profile-${account.membershipId}`);
      // Check to make sure the profile hadn't been loaded in the meantime
      if (getState().inventory.profileResponse) {
        profileResponse = getState().inventory.profileResponse;
      } else {
        infoLog('d2-stores', 'Loaded cached profile from IndexedDB');
        dispatch(profileLoaded({ profile: profileResponse, live: false }));
      }
    }

    let cachedProfileMintedDate = new Date(0);

    // If our cached profile is up to date
    if (profileResponse) {
      // TODO: need to make sure we still load at the right frequency / for manual cache busts?
      cachedProfileMintedDate = new Date(profileResponse.responseMintedTimestamp ?? 0);
      const profileAge = Date.now() - cachedProfileMintedDate.getTime();
      if (!storesLoadedSelector(getState()) && profileAge > 0 && profileAge < BUNGIE_CACHE_TTL) {
        warnLog(
          'd2-stores',
          'Cached profile is within Bungie.net cache time, skipping remote load.',
          profileAge
        );
        return profileResponse;
      } else {
        warnLog(
          'd2-stores',
          'Cached profile is older than Bungie.net cache time, proceeding.',
          profileAge
        );
      }
    }

    try {
      const remoteProfileResponse = await getStores(account);
      const remoteProfileMintedDate = new Date(remoteProfileResponse.responseMintedTimestamp ?? 0);

      // compare new response against cached response, toss if it's not newer!
      if (profileResponse) {
        if (remoteProfileMintedDate.getTime() <= cachedProfileMintedDate.getTime()) {
          warnLog(
            'd2-stores',
            'Profile from Bungie.net was not newer than cached profile, discarding.',
            remoteProfileMintedDate,
            cachedProfileMintedDate
          );
          // undefined means skip processing, in case we already have computed stores
          return storesLoadedSelector(getState()) ? undefined : profileResponse;
        } else {
          minimumCacheAge = Math.min(
            minimumCacheAge,
            remoteProfileMintedDate.getTime() - cachedProfileMintedDate.getTime()
          );
          infoLog(
            'd2-stores',
            'Profile from Bungie.net was newer than cached profile, using it.',
            remoteProfileMintedDate.getTime() - cachedProfileMintedDate.getTime(),
            minimumCacheAge,
            remoteProfileMintedDate,
            cachedProfileMintedDate
          );
        }
      }

      profileResponse = remoteProfileResponse;
      set(`profile-${account.membershipId}`, profileResponse); // don't await
      dispatch(profileLoaded({ profile: profileResponse, live: true }));
      return profileResponse;
    } catch (e) {
      dispatch(profileError(e));
      if (profileResponse) {
        errorLog(
          'd2-stores',
          'Error loading profile from Bungie.net, falling back to cached profile'
        );
        // undefined means skip processing, in case we already have computed stores
        return storesLoadedSelector(getState()) ? undefined : profileResponse;
      }
      // rethrow
      throw e;
    }
  };
}

function loadStoresData(account: DestinyAccount): ThunkResult<DimStore[] | undefined> {
  return async (dispatch, getState) => {
    const promise = (async () => {
      // If we switched account since starting this, give up
      if (account !== currentAccountSelector(getState())) {
        return;
      }

      const transaction = startTransaction({ name: 'loadStoresD2' });
      // set the transaction on the scope so it picks up any errors
      getCurrentHub()?.configureScope((scope) => scope.setSpan(transaction));

      resetItemIndexGenerator();

      try {
        const { readOnly } = getState().inventory;

        const [defs, profileInfo] = await Promise.all([
          dispatch(getDefinitions())!,
          dispatch(loadProfile(account)),
        ]);

        // If we switched account since starting this, give up
        if (account !== currentAccountSelector(getState())) {
          return;
        }

        if (!defs || !profileInfo) {
          return;
        }

        const stopTimer = timer('Process inventory');

        const buckets = d2BucketsSelector(getState())!;
        const stores = buildStores(defs, buckets, profileInfo, transaction);

        if (readOnly) {
          for (const store of stores) {
            store.hadErrors = true;
            for (const item of store.items) {
              item.lockable = false;
              item.trackable = false;
              item.notransfer = true;
              item.taggable = false;
            }
          }
        }

        // TODO: we can start moving some of this stuff to selectors? characters too
        const currencies = processCurrencies(profileInfo, defs);

        stopTimer();

        const stateSpan = transaction?.startChild({
          op: 'updateInventoryState',
        });
        const stopStateTimer = timer('Inventory state update');

        // If we switched account since starting this, give up before saving
        if (account !== currentAccountSelector(getState())) {
          return;
        }

        dispatch(cleanInfos(stores));
        dispatch(update({ stores, currencies }));

        stopStateTimer();
        stateSpan?.finish();

        return stores;
      } catch (e) {
        errorLog('d2-stores', 'Error loading stores', e);
        reportException('d2stores', e);

        // If we switched account since starting this, give up
        if (account !== currentAccountSelector(getState())) {
          return;
        }

        dispatch(handleAuthErrors(e));

        if (storesSelector(getState()).length > 0) {
          // don't replace their inventory with the error, just notify
          showNotification(bungieErrorToaster(e));
        } else {
          dispatch(error(e));
        }
        return undefined;
      } finally {
        transaction?.finish();
      }
    })();
    loadingTracker.addPromise(promise);
    return promise;
  };
}

export function buildStores(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  profileInfo: DestinyProfileResponse,
  transaction?: Transaction
): DimStore[] {
  // TODO: components may be hidden (privacy)

  if (
    !profileInfo.profileInventory.data ||
    !profileInfo.characterInventories.data ||
    !profileInfo.characters.data
  ) {
    errorLog(
      'd2-stores',
      'Vault or character inventory was missing - bailing in order to avoid corruption'
    );
    throw new DimError('BungieService.MissingInventory');
  }

  const lastPlayedDate = findLastPlayedDate(profileInfo);

  const mergedCollectibles = mergeCollectibles(
    profileInfo.profileCollectibles,
    profileInfo.characterCollectibles
  );

  const processSpan = transaction?.startChild({
    op: 'processItems',
  });
  const vault = processVault(defs, buckets, profileInfo, mergedCollectibles);

  const characters = Object.keys(profileInfo.characters.data).map((characterId) =>
    processCharacter(defs, buckets, characterId, profileInfo, mergedCollectibles, lastPlayedDate)
  );
  processSpan?.finish();

  const stores = [...characters, vault];

  const allItems = stores.flatMap((s) => s.items);

  const bucketsWithClassifieds = getBucketsWithClassifiedItems(allItems);
  const characterProgress = getCharacterProgressions(profileInfo);

  for (const s of stores) {
    updateBasePower(
      allItems,
      s,
      defs,
      characterProgress,
      // optional chaining here accounts for a edge-case possible, but type-unadvertised,
      // missing artifact power bonus. please keep this here.
      profileInfo.profileProgression?.data?.seasonalArtifact?.powerBonusProgression
        ?.progressionHash,
      bucketsWithClassifieds
    );
  }

  return stores;
}

function processCurrencies(profileInfo: DestinyProfileResponse, defs: D2ManifestDefinitions) {
  const profileCurrencies = profileInfo.profileCurrencies.data
    ? profileInfo.profileCurrencies.data.items
    : [];
  const currencies = profileCurrencies.map((c) => ({
    itemHash: c.itemHash,
    quantity: c.quantity,
    displayProperties: defs.InventoryItem.get(c.itemHash)?.displayProperties ?? {
      name: 'Unknown',
      description: 'Unknown item',
    },
  }));
  return currencies;
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
): DimStore {
  const character = profileInfo.characters.data![characterId];
  const characterInventory = profileInfo.characterInventories.data?.[characterId]?.items || [];
  const profileInventory = profileInfo.profileInventory.data?.items || [];
  const characterEquipment = profileInfo.characterEquipment.data?.[characterId]?.items || [];
  const profileRecords = profileInfo.profileRecords?.data;
  const itemComponents = profileInfo.itemComponents;
  const uninstancedItemObjectives =
    getCharacterProgressions(profileInfo, characterId)?.uninstancedItemObjectives || [];

  const store = makeCharacter(defs, character, lastPlayedDate, profileRecords);

  // We work around the weird account-wide buckets by assigning them to the current character
  const items = characterInventory.concat(characterEquipment.flat());

  if (store.current) {
    for (const i of profileInventory) {
      const bucket = buckets.byHash[i.bucketHash];
      // items that can be stored in a vault
      if (bucket && (bucket.vaultBucket || bucket.hash === BucketHashes.SpecialOrders)) {
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
    uninstancedItemObjectives,
    profileRecords
  );
  store.items = processedItems;
  return store;
}

function processVault(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  profileInfo: DestinyProfileResponse,
  mergedCollectibles: {
    [hash: number]: DestinyCollectibleComponent;
  }
): DimStore {
  const profileInventory = profileInfo.profileInventory.data
    ? profileInfo.profileInventory.data.items
    : [];
  const profileRecords = profileInfo.profileRecords?.data; // Not present in the initial load
  const itemComponents = profileInfo.itemComponents;

  const store = makeVault();

  const items: DestinyItemComponent[] = [];
  for (const i of profileInventory) {
    const bucket = buckets.byHash[i.bucketHash];
    // items that cannot be stored in the vault, and are therefore *in* a vault
    if (bucket && !bucket.vaultBucket && bucket.hash !== BucketHashes.SpecialOrders) {
      items.push(i);
    }
  }

  const processedItems = processItems(
    defs,
    buckets,
    store,
    items,
    itemComponents,
    mergedCollectibles,
    undefined,
    profileRecords
  );
  store.items = processedItems;

  return store;
}

/**
 * Find the date of the most recently played character.
 */
function findLastPlayedDate(profileInfo: DestinyProfileResponse) {
  const dateLastPlayed = profileInfo.profile.data?.dateLastPlayed;
  if (dateLastPlayed) {
    return new Date(dateLastPlayed);
  }
  return new Date(0);
}

export const fakeCharacterStatHashes = {
  maxGearPower: -3,
  powerBonus: -2,
  maxTotalPower: -1,
};

// Add a fake stat for "max base power"
function updateBasePower(
  allItems: DimItem[],
  store: DimStore,
  defs: D2ManifestDefinitions,
  characterProgress: DestinyCharacterProgressionComponent | undefined,
  bonusPowerProgressionHash: number | undefined,
  bucketsWithClassifieds: Set<number>
) {
  if (!store.isVault) {
    const def = defs.Stat.get(StatHashes.Power);
    const { equippable, unrestricted } = maxLightItemSet(allItems, store);

    // ALL WEAPONS count toward your drops. armor on another character doesn't count.
    // (maybe just because it's on a different class? who knows. can't test.)
    const dropPowerItemSet = maxLightItemSet(
      allItems.filter((i) => i.bucket.inWeapons || i.owner === 'vault' || i.owner === store.id),
      store
    ).unrestricted;
    const dropPowerLevel = getLight(store, dropPowerItemSet);

    const unrestrictedMaxGearPower = getLight(store, unrestricted);
    const unrestrictedPowerFloor = Math.floor(unrestrictedMaxGearPower);
    const equippableMaxGearPower = getLight(store, equippable);

    const statProblems: DimCharacterStat['statProblems'] = {};

    statProblems.notEquippable = unrestrictedMaxGearPower !== equippableMaxGearPower;
    statProblems.notOnStore = dropPowerLevel !== unrestrictedMaxGearPower;

    statProblems.hasClassified = statProblems.hasClassified = hasAffectingClassified(
      unrestricted,
      bucketsWithClassifieds
    );

    store.stats.maxGearPower = {
      hash: fakeCharacterStatHashes.maxGearPower,
      name: t('Stats.MaxGearPowerAll'),
      // used to be t('Stats.MaxGearPower'), a translation i don't want to lose yet
      statProblems,
      description: '',
      richTooltip: ItemPowerSet(unrestricted, unrestrictedPowerFloor),
      value: unrestrictedMaxGearPower,
      icon: helmetIcon,
    };

    const artifactPower = getArtifactBonus(store);
    store.stats.powerModifier = {
      hash: fakeCharacterStatHashes.powerBonus,
      name: t('Stats.PowerModifier'),
      description: '',
      richTooltip: ArtifactXP(characterProgress, bonusPowerProgressionHash),
      value: artifactPower,
      icon: xpIcon,
    };

    store.stats.maxTotalPower = {
      hash: fakeCharacterStatHashes.maxTotalPower,
      name: t('Stats.MaxTotalPower'),
      statProblems,
      description: '',
      value: unrestrictedMaxGearPower + artifactPower,
      icon: bungieNetPath(def.displayProperties.icon),
    };
  }
}
