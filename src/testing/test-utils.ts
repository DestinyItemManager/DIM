import { GlobalSettings, Loadout, LoadoutItem } from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { AccountsState } from 'app/accounts/reducer';
import { getBuckets } from 'app/destiny2/d2-buckets';
import { allTables, buildDefinitionsFromManifest } from 'app/destiny2/d2-definitions';
import { DimApiState } from 'app/dim-api/reducer';
import { FarmingState } from 'app/farming/reducer';
import { DIM_LANG_INFOS } from 'app/i18n';
import { buildStores } from 'app/inventory/store/d2-store-factory';
import { InGameLoadoutState } from 'app/loadout/ingame/reducer';
import { LoadoutsState } from 'app/loadout/reducer';
import { downloadManifestComponents } from 'app/manifest/manifest-service-json';
import { initialSettingsState } from 'app/settings/initial-settings';
import { ShellState } from 'app/shell/reducer';
import { humanBytes } from 'app/storage/human-bytes';
import { RootState } from 'app/store/types';
import { StreamDeckState } from 'app/stream-deck/reducer';
import { delay } from 'app/utils/promises';
import { VendorsState } from 'app/vendors/reducer';
import { WishListsState } from 'app/wishlists/reducer';
import { WishListAndInfo, WishListInfo, WishListRoll } from 'app/wishlists/types';
import {
  AllDestinyManifestComponents,
  DestinyManifest,
  DestinyProfileResponse,
  DestinyVendorsResponse,
  ServerResponse,
} from 'bungie-api-ts/destiny2';
import { F_OK } from 'constants';
import i18next from 'i18next';
import fetchMock from 'jest-fetch-mock';
import en from 'locale/en.json';
import ja from 'locale/ja.json';
import _ from 'lodash';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getManifest as d2GetManifest } from '../app/bungie-api/destiny2-api';
import profile from './data/profile-2024-06-13.json';
import vendors from './data/vendors-2024-06-13.json';

/**
 * Get the current manifest as JSON. Downloads the manifest if not cached.
 */
// TODO: maybe use the fake indexeddb and just insert it from a file on startup??
// fake indexeddb + mock server (msw or jest-mock-fetch) to simulate the API??
export async function getTestManifestJson() {
  fetchMock.dontMock();
  try {
    // download and parse manifest
    const cacheDir = path.resolve(__dirname, '..', '..', 'manifest-cache');

    // In this mode we assume the last-written file in the manifest-cache directory is the one we want
    if (process.env.LOCAL_MANIFEST) {
      const result = await getLocalManifest(cacheDir);
      if (result) {
        return result;
      }
    }

    let manifest: DestinyManifest;
    for (let i = 0; ; i++) {
      try {
        manifest = await d2GetManifest();
        break;
      } catch (e) {
        if (i === 4) {
          // Fall back on local manifest when Bungie.net is down
          const result = await getLocalManifest(cacheDir);
          if (result) {
            return result;
          }
          throw e;
        }
        await delay(1000);
      }
    }

    const enManifestUrl = manifest.jsonWorldContentPaths.en;
    const filename = path.resolve(cacheDir, path.basename(enManifestUrl));

    const fileExists = await fs
      .access(filename, F_OK)
      .then(() => true)
      .catch(() => false);

    if (fileExists) {
      return [
        JSON.parse(await fs.readFile(filename, 'utf-8')) as AllDestinyManifestComponents,
        filename,
      ] as const;
    }

    await fs.mkdir(cacheDir, { recursive: true });

    const manifestDb = await downloadManifestComponents(
      manifest.jsonWorldComponentContentPaths.en,
      allTables,
    );
    await fs.writeFile(filename, JSON.stringify(manifestDb), 'utf-8');
    return [manifestDb, filename] as const;
  } finally {
    fetchMock.dontMock();
  }
}

// This gets the local manifest by finding the most recently modified json file in the cache directory.
async function getLocalManifest(cacheDir: string) {
  const files = (await fs.readdir(cacheDir)).filter((f) => path.extname(f) === '.json');
  if (files.length) {
    const mtimes = await Promise.all(
      files.map(async (f) => ({
        filename: f,
        mtime: (await fs.stat(path.join(cacheDir, f))).mtime.getTime(),
      })),
    );

    const filename = path.resolve(cacheDir, _.maxBy(mtimes, (f) => f.mtime)!.filename);
    return [
      JSON.parse(await fs.readFile(filename, 'utf-8')) as AllDestinyManifestComponents,
      filename,
    ] as const;
  }
}

export const getTestDefinitions = _.once(async () => {
  const [manifestJson] = await getTestManifestJson();
  return buildDefinitionsFromManifest(manifestJson);
});

export const testAccount = {
  displayName: 'VidBoi-BMC',
  originalPlatformType: 2,
  membershipId: '4611686018433092312',
  platformLabel: 'PlayStation',
  destinyVersion: 2,
  platforms: [1, 3, 5, 2],
  lastPlayed: '2021-05-08T03:34:26.000Z',
};

export const getTestProfile = () =>
  (profile as unknown as ServerResponse<DestinyProfileResponse>).Response;
export const getTestVendors = () =>
  (vendors as unknown as ServerResponse<DestinyVendorsResponse>).Response;

export const getTestStores = _.once(async () => {
  const manifest = await getTestDefinitions();

  const stores = buildStores({
    defs: manifest,
    buckets: getBuckets(manifest),
    profileResponse: getTestProfile(),
    customStats: [],
  });
  return stores;
});

/**
 * Set up i18n so the `t` function will work, for en and ja locales.
 *
 * Use `i18next.changeLanguage('en');` to set language before tests.
 */
export function setupi18n() {
  i18next.init({
    lng: 'en',
    debug: true,
    initImmediate: true,
    compatibilityJSON: 'v3',
    lowerCaseLng: true,
    interpolation: {
      escapeValue: false,
      format(val: string, format) {
        switch (format) {
          case 'pct':
            return `${Math.min(100, Math.floor(100 * parseFloat(val)))}%`;
          case 'humanBytes':
            return humanBytes(parseInt(val, 10));
          case 'number':
            return parseInt(val, 10).toLocaleString();
          default:
            return val;
        }
      },
    },
    resources: {
      en: {
        translation: en,
      },
      ja: {
        translation: ja,
      },
    },
  });

  for (const [otherLang, { pluralOverride }] of Object.entries(DIM_LANG_INFOS)) {
    if (pluralOverride) {
      // eslint-disable-next-line
      i18next.services.pluralResolver.addRule(
        otherLang,
        // eslint-disable-next-line
        i18next.services.pluralResolver.getRule('en'),
      );
    }
  }
}

export const getTestAccountsState = (chance: Chance.Chance): AccountsState => ({
  accounts: [],
  currentAccountMembershipId: chance.string({ symbols: false }),
  currentAccountDestinyVersion: 2,
  loaded: chance.bool(),
  loadedFromIDB: chance.bool(),
  needsLogin: chance.bool(),
  needsDeveloper: chance.bool(),
});

export const getTestDestinyAccount = (chance: Chance.Chance): DestinyAccount => ({
  displayName: chance.name(),
  originalPlatformType: chance.d6(),
  platformLabel: chance.string(),
  membershipId: chance.string(),
  destinyVersion: 2,
  platforms: [chance.d6()],
  lastPlayed: new Date(),
});

export const getTestInventoryState = async (chance: Chance.Chance) => ({
  stores: await getTestStores(),
  currencies: [],
  newItems: new Set(''),
  newItemsLoaded: chance.bool(),
});

export const getTestShellState = (chance: Chance.Chance): ShellState => ({
  isPhonePortrait: chance.bool(),
  searchQuery: chance.word(),
  searchQueryVersion: chance.d10(),
  searchResultsOpen: chance.bool(),
  loadingMessages: chance.n(() => chance.word(), chance.d6()),
  bungieAlerts: [],
});

export const getTestLoadoutsState = (chance: Chance.Chance): LoadoutsState => ({
  previousLoadouts: { [chance.string()]: [] },
  selectedLoadoutStoreId: chance.pickone([chance.string(), undefined]),
});

export const getTestWishListRoll = (chance: Chance.Chance): WishListRoll => ({
  itemHash: chance.natural(),
  recommendedPerks: new Set(chance.n(() => chance.natural(), 4)),
  isExpertMode: chance.bool(),
  isUndesirable: chance.bool(),
  notes: chance.sentence(),
});

export const getTestWishListInfo = (chance: Chance.Chance): WishListInfo => ({
  url: chance.pickone([chance.url(), undefined]),
  title: chance.sentence(),
  description: chance.sentence(),
  numRolls: chance.d10(),
});

export const getTestWishListAndInfo = (chance: Chance.Chance): WishListAndInfo => ({
  wishListRolls: chance.n(() => getTestWishListRoll(chance), chance.d4()),
  source: chance.url(),
  infos: chance.n(() => getTestWishListInfo(chance), chance.d4()),
});

export const getTestWishListsState = (chance: Chance.Chance): WishListsState => ({
  loaded: chance.bool(),
  wishListAndInfo: getTestWishListAndInfo(chance),
  lastFetched: new Date(),
});

export const getTestFarmingState = (chance: Chance.Chance): FarmingState => ({
  storeId: chance.string(),
  numInterruptions: chance.d4(),
});

export const getTestVendorsState = (chance: Chance.Chance): VendorsState => ({
  vendorsByCharacter: {
    [chance.string()]: {},
  },
  showUnacquiredOnly: chance.bool(),
});

export const getTestStreamDeckState = (chance: Chance.Chance): StreamDeckState => ({
  enabled: chance.bool(),
  connected: chance.bool(),
});

export const getTestGlobalSettings = (chance: Chance.Chance): GlobalSettings => ({
  dimApiEnabled: chance.bool(),
  destinyProfileMinimumRefreshInterval: chance.d30(),
  destinyProfileRefreshInterval: chance.d30(),
  autoRefresh: chance.bool(),
  refreshProfileOnVisible: chance.bool(),
  dimProfileMinimumRefreshInterval: chance.d30(),
  showIssueBanner: chance.bool(),
});

export const getTestLoadoutItem = (chance: Chance.Chance): LoadoutItem => ({
  hash: chance.natural(),
});

export const getTestLoadout = (chance: Chance.Chance): Loadout => ({
  id: chance.guid(),
  name: chance.sentence(),
  classType: chance.d4(),
  clearSpace: chance.bool(),
  equipped: chance.n(() => getTestLoadoutItem(chance), chance.d10()),
  unequipped: chance.n(() => getTestLoadoutItem(chance), chance.d10()),
});

export const getTestDimApiState = (chance: Chance.Chance): DimApiState => ({
  globalSettings: getTestGlobalSettings(chance),
  globalSettingsLoaded: chance.bool(),
  apiPermissionGranted: chance.pickone([chance.bool(), null]),
  profileLoadedFromIndexedDb: chance.bool(),
  profileLoaded: chance.bool(),
  profileLastLoaded: chance.timestamp(),
  settings: initialSettingsState,
  itemHashTags: {
    [chance.natural()]: {
      hash: chance.natural(),
    },
  },
  profiles: {
    [chance.string()]: {
      profileLastLoaded: chance.timestamp(),
      loadouts: {
        [chance.string()]: getTestLoadout(chance),
      },
      tags: {
        [chance.string()]: {
          id: chance.string(),
        },
      },
      triumphs: chance.n(() => chance.natural(), chance.d6()),
    },
  },
  searches: {
    1: [],
    2: [],
  },
  updateQueue: [],
  updateInProgressWatermark: chance.d6() - 1,
});

export const getTestInGameLoadoutState = (chance: Chance.Chance): InGameLoadoutState => ({
  loadouts: { [chance.string()]: [] },
});

export const getTestRootState = async (chance: Chance.Chance): Promise<RootState> => ({
  accounts: getTestAccountsState(chance),
  inventory: await getTestInventoryState(chance),
  shell: getTestShellState(chance),
  loadouts: getTestLoadoutsState(chance),
  wishLists: getTestWishListsState(chance),
  farming: getTestFarmingState(chance),
  manifest: {},
  vendors: getTestVendorsState(chance),
  compare: {},
  streamDeck: getTestStreamDeckState(chance),
  dimApi: getTestDimApiState(chance),
  clarity: {},
  inGameLoadouts: getTestInGameLoadoutState(chance),
});
