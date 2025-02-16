import { startSpan } from '@sentry/browser';
import { handleAuthErrors } from 'app/accounts/actions';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { getPlatforms } from 'app/accounts/platforms';
import { currentAccountSelector } from 'app/accounts/selectors';
import { loadClarity } from 'app/clarity/descriptions/loadDescriptions';
import { customStatsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { inGameLoadoutLoaded } from 'app/loadout/ingame/actions';
import { processInGameLoadouts } from 'app/loadout/loadout-type-converters';
import { loadCoreSettings } from 'app/manifest/actions';
import { checkForNewManifest } from 'app/manifest/manifest-service-json';
import { d2ManifestSelector, manifestSelector } from 'app/manifest/selectors';
import { loadingTracker } from 'app/shell/loading-tracker';
import { get, set } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import { DimError } from 'app/utils/dim-error';
import { convertToError, errorMessage } from 'app/utils/errors';
import { errorLog, infoLog, timer, warnLog } from 'app/utils/log';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { getCharacters as d1GetCharacters } from '../bungie-api/destiny1-api';
import { getCharacters, getStores } from '../bungie-api/destiny2-api';
import { bungieErrorToaster } from '../bungie-api/error-toaster';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions';
import { bungieNetPath } from '../dim-ui/BungieImage';
import { showNotification } from '../notifications/notifications';
import { reportException } from '../utils/sentry';
import {
  CharacterInfo,
  charactersUpdated,
  error,
  loadNewItems,
  profileError,
  profileLoaded,
  update,
} from './actions';
import { notifyOtherTabsStoreUpdated } from './cross-tab';
import { cleanInfos } from './dim-item-info';
import { d2BucketsSelector, storesLoadedSelector } from './selectors';
import { DimStore } from './store-types';
import { getCharacterStatsData as getD1CharacterStatsData } from './store/character-utils';
import { buildStores, getCharacterStatsData } from './store/d2-store-factory';
import { resetItemIndexGenerator } from './store/item-index';
import { getCurrentStore } from './stores-helpers';

const TAG = 'd2-stores';

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
      characters = profileInfo.characters.map((character) => {
        const characterBase = character.characterBase;
        return {
          characterId: characterBase.characterId,
          level: character.characterLevel,
          powerLevel: characterBase.powerLevel,
          percentToNextLevel: character.percentToNextLevel / 100,
          background: bungieNetPath(character.backgroundPath),
          icon: bungieNetPath(character.emblemPath),
          stats: getD1CharacterStatsData(getState().manifest.d1Manifest!, characterBase),
        };
      });
    }

    // If we switched account since starting this, give up
    if (account !== currentAccountSelector(getState())) {
      return;
    }

    dispatch(charactersUpdated(characters));
  };
}

let firstTime = true;

let loading = false;

/**
 * Returns a promise for a fresh view of the stores and their items.
 */
export function loadStores({
  fromOtherTab = false,
}: {
  fromOtherTab?: boolean;
} = {}): ThunkResult<DimStore[] | undefined> {
  return async (dispatch, getState) => {
    try {
      let stores: DimStore[] | undefined;
      if (loading) {
        return;
      }
      await navigator.locks.request(
        'loadStores',
        {
          // If another tab is working on it, don't wait. The callback will get a null lock.
          ifAvailable: true,
          mode: 'exclusive',
        },
        async (lock) => {
          if (!lock) {
            infoLog('cross-tab', 'Another tab is already loading stores');
            // This means another tab was already requesting the stores.
            throw new Error('lock-held');
          }
          loading = true;
          try {
            let account = currentAccountSelector(getState());
            if (!account) {
              // TODO: throw here?
              await dispatch(getPlatforms);
              account = currentAccountSelector(getState());
              if (!account || account.destinyVersion !== 2) {
                return;
              }
            }

            dispatch(loadCoreSettings()); // no need to wait
            $featureFlags.clarityDescriptions && dispatch(loadClarity()); // no need to await
            await dispatch(loadNewItems(account));
            // The first time we load, allow the data to be loaded from IDB. We then do a second
            // load to make sure that we immediately try to get remote data.
            if (firstTime) {
              await dispatch(loadStoresData(account, { firstTime, fromOtherTab }));
              firstTime = false;
            }
            stores = await dispatch(loadStoresData(account, { firstTime, fromOtherTab }));
          } finally {
            loading = false;
          }
        },
      );
      // Need to do this after the lock has been released
      if (!firstTime && stores !== undefined && !fromOtherTab) {
        notifyOtherTabsStoreUpdated();
      }
      return stores;
    } catch (e) {
      if (!(e instanceof Error) || e.message !== 'lock-held') {
        throw e;
      }
    }
  };
}

/** How old the profile can be and still trigger cleanup of tags. */
const FRESH_ENOUGH_TO_CLEAN_INFOS = 90_000; // 90 seconds

function loadProfile(
  account: DestinyAccount,
  {
    firstTime,
    fromOtherTab,
  }: {
    firstTime: boolean;
    fromOtherTab: boolean;
  },
): ThunkResult<
  | {
      profile: DestinyProfileResponse;
      /** Whether the data is from a "live", remote Bungie.net response. false if this is cached data. */
      live: boolean;
      readOnly?: boolean;
    }
  | undefined
> {
  return async (dispatch, getState) => {
    const mockProfileData = getState().inventory.mockProfileData;
    if (mockProfileData) {
      return { profile: mockProfileData, live: false, readOnly: true };
    }

    const cachedProfileKey = `profile-${account.membershipId}`;

    // First try loading from IndexedDB
    let cachedProfileResponse = getState().inventory.profileResponse;
    // TODO: always check IDB, in case another tab loaded it?
    if (!cachedProfileResponse || fromOtherTab) {
      try {
        cachedProfileResponse = await get<DestinyProfileResponse>(cachedProfileKey);
        // Check to make sure the profile hadn't been loaded in the meantime
        if (!fromOtherTab && getState().inventory.profileResponse) {
          cachedProfileResponse = getState().inventory.profileResponse;
        } else if (cachedProfileResponse) {
          const profileAgeSecs =
            (Date.now() - new Date(cachedProfileResponse.responseMintedTimestamp ?? 0).getTime()) /
            1000;
          if (fromOtherTab) {
            infoLog(
              TAG,
              `Loaded cached profile from IndexedDB because another tab updated it. It is ${profileAgeSecs}s old.`,
            );
          } else {
            infoLog(
              TAG,
              `Loaded cached profile from IndexedDB, using it until new data is available. It is ${profileAgeSecs}s old.`,
            );
          }
          dispatch(profileLoaded({ profile: cachedProfileResponse, live: fromOtherTab }));
          // The first time we load, just use the IDB version if we can, to speed up loading
          if (firstTime) {
            return { profile: cachedProfileResponse, live: false };
          }
        }
      } catch (e) {
        errorLog(TAG, 'Failed to load profile response from IDB', e);
      }
    }

    const cachedProfileMintedDate = cachedProfileResponse
      ? new Date(cachedProfileResponse.responseMintedTimestamp ?? 0)
      : new Date(0);

    try {
      const remoteProfileResponse = await getStores(account);
      const now = Date.now();
      const remoteProfileMintedDate = new Date(remoteProfileResponse.responseMintedTimestamp ?? 0);
      const remoteProfileAgeSec = (now - remoteProfileMintedDate.getTime()) / 1000;

      // compare new response against cached response, toss if it's not newer!
      if (cachedProfileResponse) {
        const cachedProfileAgeSec = (now - cachedProfileMintedDate.getTime()) / 1000;
        if (remoteProfileMintedDate.getTime() <= cachedProfileMintedDate.getTime()) {
          const eq = remoteProfileMintedDate.getTime() === cachedProfileMintedDate.getTime();
          const storesLoaded = storesLoadedSelector(getState());
          const action = storesLoaded ? 'Skipping update.' : 'Using the cached profile.';
          if (eq) {
            infoLog(
              TAG,
              `Profile from Bungie.net is is ${remoteProfileAgeSec}s old, which is the same age as the cached profile.`,
              action,
            );
          } else {
            warnLog(
              TAG,
              `Profile from Bungie.net is ${remoteProfileAgeSec}s old, while the cached profile is ${cachedProfileAgeSec}s old.`,
              action,
            );
          }
          // Clear the error since we did load correctly
          dispatch(profileError(undefined));
          // undefined means skip processing, in case we already have computed stores
          return storesLoaded ? undefined : { profile: cachedProfileResponse, live: false };
        } else {
          infoLog(
            TAG,
            `Profile from Bungie.net is is ${remoteProfileAgeSec}s old, while the cached profile is ${cachedProfileAgeSec}s old.`,
            `Using the new profile from Bungie.net.`,
          );
        }
      } else {
        infoLog(
          TAG,
          `No cached profile, using profile from Bungie.net which is ${remoteProfileAgeSec}s old.`,
        );
      }

      await set(cachedProfileKey, remoteProfileResponse);
      dispatch(profileLoaded({ profile: remoteProfileResponse, live: true }));
      return { profile: remoteProfileResponse, live: true };
    } catch (e) {
      dispatch(handleAuthErrors(e));
      dispatch(profileError(convertToError(e)));
      if (cachedProfileResponse) {
        errorLog(TAG, 'Error loading profile from Bungie.net, falling back to cached profile', e);
        // undefined means skip processing, in case we already have computed stores
        return storesLoadedSelector(getState())
          ? undefined
          : { profile: cachedProfileResponse, live: false };
      }
      // rethrow
      throw e;
    }
  };
}

let lastCheckedManifest = 0;

function loadStoresData(
  account: DestinyAccount,
  profileArgs: {
    firstTime: boolean;
    fromOtherTab: boolean;
  },
): ThunkResult<DimStore[] | undefined> {
  return async (dispatch, getState) => {
    const promise = (async () => {
      // If we switched account since starting this, give up
      if (account !== currentAccountSelector(getState())) {
        return;
      }

      return startSpan({ name: 'loadStoresD2' }, async () => {
        resetItemIndexGenerator();

        try {
          const [originalDefs, profileInfo] = await Promise.all([
            dispatch(getDefinitions()),
            dispatch(loadProfile(account, profileArgs)),
          ]);

          let defs = originalDefs;

          // If we switched account since starting this, give up
          if (account !== currentAccountSelector(getState())) {
            return;
          }

          for (let i = 0; i < 2; i++) {
            if (!defs || !profileInfo) {
              return;
            }

            const { profile: profileResponse, live, readOnly } = profileInfo;

            const stopTimer = timer(TAG, 'Process inventory');

            const buckets = d2BucketsSelector(getState())!;
            const customStats = customStatsSelector(getState());
            const stores = buildStores({
              defs,
              buckets,
              customStats,
              profileResponse,
            });

            // One reason stores could have errors is if the manifest was not up
            // to date. Check to see if it has updated, and if so, download it and
            // immediately try again.
            if (stores.some((s) => s.hadErrors)) {
              if (lastCheckedManifest - Date.now() < 5 * 60 * 1000) {
                return;
              }
              lastCheckedManifest = Date.now();

              if (await checkForNewManifest()) {
                defs = await dispatch(getDefinitions(true));
                continue; // go back to the top of the loop with the new defs
              }
            }

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

            const currencies = processCurrencies(profileResponse, defs);

            const loadouts = processInGameLoadouts(profileResponse, defs);

            stopTimer();

            startSpan({ name: 'updateInventoryState' }, () => {
              const stopStateTimer = timer(TAG, 'Inventory state update');

              // If we switched account since starting this, give up before saving
              if (account !== currentAccountSelector(getState())) {
                return;
              }

              if (!getCurrentStore(stores)) {
                errorLog(TAG, 'No characters in profile');
                dispatch(
                  error(
                    new DimError(
                      'Accounts.NoCharactersTitle',
                      t('Accounts.NoCharacters'),
                    ).withNoSocials(),
                  ),
                );
                return;
              }

              // Cached loads can come from IDB, which can be VERY outdated, so don't
              // remove item tags/notes based on that. We also refuse to clean tags if
              // the profile is too old in wall-clock time. Technically we could do
              // this *only* based on the minted timestamp, but there's no real point
              // in cleaning items for cached loads since they presumably were cleaned
              // already.
              const profileMintedDate = new Date(profileResponse.responseMintedTimestamp ?? 0);
              if (live && Date.now() - profileMintedDate.getTime() < FRESH_ENOUGH_TO_CLEAN_INFOS) {
                dispatch(cleanInfos(stores));
              }
              dispatch(update({ stores, currencies }));
              dispatch(inGameLoadoutLoaded(loadouts));

              stopStateTimer();
            });

            return stores;
          }
        } catch (e) {
          errorLog(TAG, 'Error loading stores', e);
          reportException('d2stores', e);

          // If we switched account since starting this, give up
          if (account !== currentAccountSelector(getState())) {
            return;
          }

          dispatch(handleAuthErrors(e));

          if (storesLoadedSelector(getState())) {
            // don't replace their inventory with the error, just notify
            showNotification(bungieErrorToaster(errorMessage(e)));
          } else {
            dispatch(error(convertToError(e)));
          }
          return undefined;
        }
      });
    })();
    loadingTracker.addPromise(promise);
    return promise;
  };
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
